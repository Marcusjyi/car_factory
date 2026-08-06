// File generated / updated from Firebase Console configs.
// Android: android/app/google-services.json
// iOS: ios/Runner/GoogleService-Info.plist (클라이언트 Apple ID 등록 후 추가)
//
// Prefer regenerating with: dart pub global run flutterfire_cli:flutterfire configure
//
// ignore_for_file: lines_longer_than_80_chars

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Firebase 프로젝트 `car-factory-40a14` 클라이언트 옵션.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAMRBVqsMWDD4srRWOzYeRk5hN3OvGKOTk',
    appId: '1:854722224560:web:1095faeaf38da7fa0eb675',
    messagingSenderId: '854722224560',
    projectId: 'car-factory-40a14',
    authDomain: 'car-factory-40a14.firebaseapp.com',
    storageBucket: 'car-factory-40a14.firebasestorage.app',
  );

  /// From android/app/google-services.json
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBfyuCsXrwkvH7BaNfN6bmMuUkx1-Sdgps',
    appId: '1:854722224560:android:53913cb206f4a0c30eb675',
    messagingSenderId: '854722224560',
    projectId: 'car-factory-40a14',
    storageBucket: 'car-factory-40a14.firebasestorage.app',
  );

  /// TODO: iOS 앱 등록 후 GoogleService-Info.plist 값으로 교체
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAMRBVqsMWDD4srRWOzYeRk5hN3OvGKOTk',
    appId: '1:854722224560:web:1095faeaf38da7fa0eb675',
    messagingSenderId: '854722224560',
    projectId: 'car-factory-40a14',
    storageBucket: 'car-factory-40a14.firebasestorage.app',
    iosBundleId: 'com.carfactory.carFactoryApp',
  );
}
