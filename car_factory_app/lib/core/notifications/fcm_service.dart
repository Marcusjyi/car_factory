import 'dart:async';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import '../firebase/firebase_bootstrap.dart';

/// 백그라운드 메시지 (엔트리포인트 — main 상단에서 등록)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // 백그라운드는 OS 알림으로 표시. 추가 처리가 필요하면 여기서.
  if (kDebugMode) {
    // ignore: avoid_print
    print('[CF][FCM] background: ${message.messageId} ${message.data}');
  }
}

/// 채팅 등 FCM 토큰 등록·수신·딥링크
class FcmService {
  FcmService._();
  static final FcmService instance = FcmService._();

  final _messaging = FirebaseMessaging.instance;
  GoRouter? _router;
  StreamSubscription<String>? _tokenSub;
  StreamSubscription<RemoteMessage>? _openSub;
  StreamSubscription<User?>? _authSub;
  bool _started = false;
  String? _pendingRoute;

  Future<void> start() async {
    if (_started || kIsWeb) return;
    _started = true;

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    FirebaseBootstrap.debugLog(
      'FCM permission: ${settings.authorizationStatus}',
    );

    if (Platform.isAndroid) {
      await _messaging.setAutoInitEnabled(true);
    }

    FirebaseMessaging.onMessage.listen((message) {
      FirebaseBootstrap.debugLog(
        'FCM foreground: ${message.notification?.title} '
        '${message.notification?.body}',
      );
    });

    _openSub = FirebaseMessaging.onMessageOpenedApp.listen(_handleOpen);
    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      _handleOpen(initial);
    }

    _authSub = FirebaseBootstrap.auth.authStateChanges().listen((user) async {
      if (user == null) {
        await _clearLocalTokenBinding();
        return;
      }
      await syncToken();
    });

    _tokenSub = _messaging.onTokenRefresh.listen((token) async {
      await _saveToken(token);
    });

    if (FirebaseBootstrap.auth.currentUser != null) {
      await syncToken();
    }
  }

  void attachRouter(GoRouter router) {
    _router = router;
    final pending = _pendingRoute;
    if (pending != null) {
      _pendingRoute = null;
      scheduleMicrotask(() => _router?.go(pending));
    }
  }

  Future<void> syncToken() async {
    if (kIsWeb) return;
    final user = FirebaseBootstrap.auth.currentUser;
    if (user == null) return;
    try {
      final token = await _messaging.getToken();
      if (token == null || token.isEmpty) {
        FirebaseBootstrap.debugLog('FCM token empty');
        return;
      }
      await _saveToken(token);
    } catch (e) {
      FirebaseBootstrap.debugLog('FCM syncToken failed: $e');
    }
  }

  Future<void> _saveToken(String token) async {
    final uid = FirebaseBootstrap.auth.currentUser?.uid;
    if (uid == null) return;
    final platform = Platform.isIOS ? 'ios' : 'android';
    final docId = _tokenDocId(token);
    await FirebaseBootstrap.db
        .collection('users')
        .doc(uid)
        .collection('fcmTokens')
        .doc(docId)
        .set({
      'token': token,
      'platform': platform,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    FirebaseBootstrap.debugLog('FCM token saved ($platform)');
  }

  Future<void> _clearLocalTokenBinding() async {
    // 재로그인 시 syncToken이 다시 등록한다.
  }

  void _handleOpen(RemoteMessage message) {
    final data = message.data;
    final type = data['type'];
    final roomId = data['roomId'];
    if (type == 'chat' && roomId is String && roomId.isNotEmpty) {
      final route = '/chat/$roomId';
      if (_router != null) {
        _router!.go(route);
      } else {
        _pendingRoute = route;
      }
    }
  }

  /// Firestore 문서 ID로 쓸 수 있게 토큰을 안전하게 변환
  static String _tokenDocId(String token) {
    final cleaned = token.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    if (cleaned.length <= 120) return cleaned;
    return cleaned.substring(0, 120);
  }

  Future<void> dispose() async {
    await _tokenSub?.cancel();
    await _openSub?.cancel();
    await _authSub?.cancel();
  }
}
