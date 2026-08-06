import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../core/firebase/firebase_bootstrap.dart';
import '../../shared/models/user.dart';

enum AuthStatus { loading, unauthenticated, authenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.firebaseUser,
    this.profile,
    this.errorMessage,
  });

  final AuthStatus status;
  final User? firebaseUser;
  final UserDocument? profile;
  final String? errorMessage;

  static const loading = AuthState(status: AuthStatus.loading);
  static const unauthenticated =
      AuthState(status: AuthStatus.unauthenticated);
}

class AuthController extends StateNotifier<AuthState> {
  AuthController() : super(AuthState.loading) {
    _sub = FirebaseBootstrap.auth.authStateChanges().listen(_onAuthChanged);
  }

  StreamSubscription<User?>? _sub;
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  Future<void> _onAuthChanged(User? user) async {
    if (user == null) {
      state = AuthState.unauthenticated;
      return;
    }
    try {
      final profile = await _loadProfile(user.uid);
      state = AuthState(
        status: AuthStatus.authenticated,
        firebaseUser: user,
        profile: profile,
      );
    } catch (e) {
      state = AuthState(
        status: AuthStatus.authenticated,
        firebaseUser: user,
        errorMessage: e.toString(),
      );
    }
  }

  Future<UserDocument?> _loadProfile(String uid) async {
    final snap =
        await FirebaseBootstrap.db.collection('users').doc(uid).get();
    if (!snap.exists || snap.data() == null) return null;
    return UserDocument.fromMap(uid, snap.data()!);
  }

  /// Google — Firebase Auth Provider (웹과 동일 계약).
  ///
  /// Android에서 google_sign_in 7.x 의 serverClientId 강제 요구를 피하기 위해
  /// Firebase Auth `signInWithProvider` 를 사용한다.
  Future<void> signInWithGoogle() async {
    try {
      final provider = GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await FirebaseBootstrap.auth.signInWithProvider(provider);
      await _ensureUserDoc();
    } catch (e) {
      state = AuthState(
        status: state.status,
        firebaseUser: state.firebaseUser,
        profile: state.profile,
        errorMessage: _friendlyAuthError(e),
      );
      rethrow;
    }
  }

  String _friendlyAuthError(Object e) {
    final raw = e.toString();
    if (raw.contains('canceled') ||
        raw.contains('cancelled') ||
        raw.contains('ERROR_ABORTED')) {
      return '로그인이 취소되었습니다.';
    }
    if (raw.contains('network') || raw.contains('NETWORK')) {
      return '네트워크 오류가 발생했습니다. 연결을 확인해 주세요.';
    }
    if (raw.contains('DEVELOPER_ERROR') ||
        raw.contains('10:') ||
        raw.contains('clientConfigurationError')) {
      return 'Google 로그인 설정이 필요합니다. '
          'Firebase Console에 Android 앱(com.carfactory.car_factory_app)을 '
          '등록하고 SHA-1을 추가한 뒤 google-services.json을 넣어 주세요.';
    }
    return 'Google 로그인 실패: $e';
  }

  /// 카카오/네이버는 Cloud Functions Custom Token 경로.
  /// 네이티브 SDK 연동 전: 준비 상태 메시지.
  Future<void> signInWithKakao() async {
    throw UnimplementedError(
      '카카오 로그인은 Functions kakaoAuthCallback + 카카오 SDK 연동 후 활성화됩니다.',
    );
  }

  Future<void> signInWithNaver() async {
    throw UnimplementedError(
      '네이버 로그인은 Functions naverAuthCallback + 네이버 SDK 연동 후 활성화됩니다.',
    );
  }

  /// Custom Token 로그인 (카카오/네이버 콜백 결과).
  Future<void> signInWithCustomToken(String token) async {
    await FirebaseBootstrap.auth.signInWithCustomToken(token);
    await _ensureUserDoc();
  }

  Future<void> _ensureUserDoc() async {
    final user = FirebaseBootstrap.auth.currentUser;
    if (user == null) return;
    final ref = FirebaseBootstrap.db.collection('users').doc(user.uid);
    final snap = await ref.get();
    if (snap.exists) {
      await ref.update({
        'lastLoginAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return;
    }
    await ref.set({
      'uid': user.uid,
      'name': '',
      'displayName': user.displayName ?? '',
      'photoURL': user.photoURL,
      'email': user.email,
      'phoneNumber': user.phoneNumber,
      'providers': ['google'],
      'providerAccounts': [
        {
          'provider': 'google',
          'providerUserId': user.uid,
        },
      ],
      'defaultRegion': null,
      'address': null,
      'shippingAddress': null,
      'role': 'user',
      'status': 'active',
      'tradeStats': {
        'purchaseCount': 0,
        'saleCount': 0,
        'ratingAverage': 0,
        'ratingCount': 0,
      },
      'profileCompleted': false,
      'termsAcceptedAt': FieldValue.serverTimestamp(),
      'privacyAcceptedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'lastLoginAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> signOut() async {
    await FirebaseBootstrap.auth.signOut();
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController();
});
