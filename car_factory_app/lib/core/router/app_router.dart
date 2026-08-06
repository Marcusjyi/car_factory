import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/chat/presentation/chat_list_screen.dart';
import '../../features/chat/presentation/chat_room_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/mypage/presentation/mypage_screen.dart';
import '../../features/products/presentation/parts_screen.dart';
import '../../features/products/presentation/product_detail_screen.dart';
import '../../features/sell/presentation/sell_screen.dart';
import '../../features/shell/presentation/main_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

/// GoRouter는 한 번만 생성한다.
/// auth를 watch 하면 라우터가 재생성되며 GlobalKey 충돌 → 빈 화면이 난다.
final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthRefresh(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
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
      if (loggingIn && isAuth) {
        final next = state.uri.queryParameters['next'];
        if (next != null && next.isNotEmpty) return next;
        return '/';
      }
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
      GoRoute(
        path: '/chat/:roomId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['roomId']!;
          return ChatRoomScreen(roomId: id);
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
            builder: (context, state) {
              final category = state.uri.queryParameters['category'];
              return PartsScreen(initialCategory: category);
            },
          ),
          GoRoute(
            path: '/sell',
            builder: (context, state) => const SellScreen(),
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
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(CupertinoIcons.exclamationmark_triangle, size: 40),
            const SizedBox(height: 12),
            Text('페이지를 찾을 수 없습니다\n${state.uri}'),
            TextButton(
              onPressed: () => context.go('/'),
              child: const Text('홈으로'),
            ),
          ],
        ),
      ),
    ),
  );
});

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _sub = _ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }

  final Ref _ref;
  ProviderSubscription<AuthState>? _sub;

  @override
  void dispose() {
    _sub?.close();
    super.dispose();
  }
}
