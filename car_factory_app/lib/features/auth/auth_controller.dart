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

  /// Google — Firebase Auth Provider (웹과 동일).
  Future<void> signInWithGoogle() async {
    try {
      await _googleSignIn.initialize();
      final account = await _googleSignIn.authenticate();
      final auth = account.authentication;
      final idToken = auth.idToken;
      if (idToken == null) {
        throw StateError('Google ID 토큰을 받지 못했습니다.');
      }
      final credential = GoogleAuthProvider.credential(idToken: idToken);
      await FirebaseBootstrap.auth.signInWithCredential(credential);
      await _ensureUserDoc();
    } catch (e) {
      state = AuthState(
        status: state.status,
        firebaseUser: state.firebaseUser,
        profile: state.profile,
        errorMessage: 'Google 로그인 실패: $e',
      );
      rethrow;
    }
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
