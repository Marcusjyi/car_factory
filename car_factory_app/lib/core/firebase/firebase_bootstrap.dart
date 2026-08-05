import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import 'firebase_options.dart';

/// Firebase 초기화 및 클라이언트 접근.
///
/// - Firestore: named DB `default` (서울)
/// - Functions: `asia-northeast3`
class FirebaseBootstrap {
  FirebaseBootstrap._();

  static bool _ready = false;

  static bool get isReady => _ready;

  static Future<void> init() async {
    if (_ready) return;
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    _ready = true;
  }

  static FirebaseAuth get auth => FirebaseAuth.instance;

  static FirebaseFirestore get db {
    return FirebaseFirestore.instanceFor(
      app: Firebase.app(),
      databaseId: AppConfig.firestoreDatabaseId,
    );
  }

  static FirebaseStorage get storage => FirebaseStorage.instance;

  static FirebaseFunctions get functions {
    return FirebaseFunctions.instanceFor(
      app: Firebase.app(),
      region: AppConfig.functionsRegion,
    );
  }

  static void debugLog(String message) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('[CF] $message');
    }
  }
}
