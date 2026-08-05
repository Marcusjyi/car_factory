import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/chat/presentation/chat_list_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/mypage/presentation/mypage_screen.dart';
import '../../features/products/presentation/parts_screen.dart';
import '../../features/products/presentation/product_detail_screen.dart';
import '../../features/shell/presentation/main_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: _AuthRefresh(ref),
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      final isAuth = auth.status == AuthStatus.authenticated;
      final isLoading = auth.status == AuthStatus.loading;

      if (isLoading) return null;

      const protected = [
        '/sell',
        '/cart',
        '/chat',
        '/favorites',
        '/mypage',
        '/orders',
      ];
      final needsAuth = protected.any(
        (p) =>
            state.matchedLocation == p ||
            state.matchedLocation.startsWith('$p/'),
      );

      if (needsAuth && !isAuth) {
        return '/login?next=${Uri.encodeComponent(state.uri.toString())}';
      }
      if (loggingIn && isAuth) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/parts/:productId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['productId']!;
          return ProductDetailScreen(productId: id);
        },
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/parts',
            builder: (context, state) => const PartsScreen(),
          ),
          GoRoute(
            path: '/chat',
            builder: (context, state) => const ChatListScreen(),
          ),
          GoRoute(
            path: '/mypage',
            builder: (context, state) => const MyPageScreen(),
          ),
        ],
      ),
    ],
  );
});

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }

  final Ref _ref;
}
