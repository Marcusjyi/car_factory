import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_theme.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  int _indexForLocation(String location) {
    if (location.startsWith('/parts')) return 1;
    if (location.startsWith('/chat')) return 2;
    if (location.startsWith('/mypage')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexForLocation(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/');
            case 1:
              context.go('/parts');
            case 2:
              context.go('/chat');
            case 3:
              context.go('/mypage');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: '홈',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: '부품',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: '채팅',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: '마이',
          ),
        ],
      ),
    );
  }
}

PreferredSizeWidget cfAppBar(BuildContext context, {String? title}) {
  return AppBar(
    title: Text(title ?? AppConfig.appName),
    actions: [
      IconButton(
        tooltip: '찜',
        onPressed: () => context.push('/login?next=/favorites'),
        icon: const Icon(Icons.favorite_border),
      ),
      IconButton(
        tooltip: '장바구니',
        onPressed: () => context.push('/login?next=/cart'),
        icon: const Icon(Icons.shopping_cart_outlined),
      ),
    ],
    bottom: const PreferredSize(
      preferredSize: Size.fromHeight(1),
      child: Divider(height: 1, color: AppColors.border),
    ),
  );
}
