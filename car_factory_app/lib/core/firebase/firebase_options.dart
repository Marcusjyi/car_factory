// File generated manually for bootstrap.
// Prefer regenerating with: dart pub global run flutterfire_cli:flutterfire configure
//
// ignore_for_file: lines_longer_than_80_chars

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// 스토어 `apphosting.yaml` / 웹 클라이언트와 동일한 프로젝트 값.
///
/// Android·iOS 네이티브 앱을 Firebase Console에 등록한 뒤
/// `google-services.json` / `GoogleService-Info.plist`를 넣고
/// 이 파일의 appId·apiKey를 플랫폼별로 교체하세요.
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

  /// TODO: Firebase Console → Android 앱 등록 후 값 교체
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAMRBVqsMWDD4srRWOzYeRk5hN3OvGKOTk',
    appId: '1:854722224560:web:1095faeaf38da7fa0eb675',
    messagingSenderId: '854722224560',
    projectId: 'car-factory-40a14',
    storageBucket: 'car-factory-40a14.firebasestorage.app',
  );

  /// TODO: Firebase Console → iOS 앱 등록 후 값 교체
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAMRBVqsMWDD4srRWOzYeRk5hN3OvGKOTk',
    appId: '1:854722224560:web:1095faeaf38da7fa0eb675',
    messagingSenderId: '854722224560',
    projectId: 'car-factory-40a14',
    storageBucket: 'car-factory-40a14.firebasestorage.app',
    iosBundleId: 'com.carfactory.carFactoryApp',
  );
}
