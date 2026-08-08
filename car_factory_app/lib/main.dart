import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/app_config.dart';
import 'core/firebase/firebase_bootstrap.dart';
import 'core/notifications/fcm_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  var firebaseOk = false;
  Object? firebaseError;
  try {
    await FirebaseBootstrap.init();
    firebaseOk = true;
    await FcmService.instance.start();
  } catch (e) {
    firebaseError = e;
    FirebaseBootstrap.debugLog('Firebase init failed: $e');
  }

  runApp(
    ProviderScope(
      overrides: const [],
      child: CarFactoryApp(
        firebaseReady: firebaseOk,
        firebaseError: firebaseError,
      ),
    ),
  );
}

class CarFactoryApp extends ConsumerWidget {
  const CarFactoryApp({
    super.key,
    required this.firebaseReady,
    this.firebaseError,
  });

  final bool firebaseReady;
  final Object? firebaseError;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    if (!firebaseReady) {
      return MaterialApp(
        title: AppConfig.appName,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: themeMode,
        home: Scaffold(
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Firebase 초기화 필요',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                Text(
                  'Android/iOS 앱을 Firebase Console에 등록한 뒤\n'
                  '`flutterfire configure`를 실행하세요.\n\n'
                  '$firebaseError',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.45),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final router = ref.watch(appRouterProvider);
    FcmService.instance.attachRouter(router);
    return MaterialApp.router(
      title: AppConfig.appName,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
