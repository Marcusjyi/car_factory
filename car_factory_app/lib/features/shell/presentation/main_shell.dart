import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';

/// 4탭 셸 — 홈 / 검색 / 채팅 / 마이 + 가운데 판매 FAB.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});

  static const _navHeight = 64.0;
  static const _fabSize = 60.0;
  static const _fabOverlap = 30.0;

  final Widget child;

  int _indexForLocation(String location) {
    if (location.startsWith('/parts')) return 1;
    if (location.startsWith('/chat')) return 2;
    if (location.startsWith('/mypage')) return 3;
    if (location.startsWith('/sell')) return -1;
    return 0;
  }

  void _onTap(BuildContext context, int i) {
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
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexForLocation(location);
    final cf = context.cf;
    final sellSelected = location.startsWith('/sell');
    final sellColor = sellSelected
        ? AppColors.bottomNavActive
        : AppColors.bottomNavInactive;

    return Scaffold(
      body: child,
      bottomNavigationBar: SafeArea(
        top: false,
        child: SizedBox(
          height: _navHeight,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Material(
                color: cf.bottomNavBg,
                elevation: 0,
                child: Container(
                  height: _navHeight,
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(color: cf.divider, width: 0.5),
                    ),
                  ),
                  child: Row(
                    children: [
                      _NavItem(
                        icon: CupertinoIcons.house,
                        activeIcon: CupertinoIcons.house_fill,
                        label: '홈',
                        selected: index == 0,
                        onTap: () => _onTap(context, 0),
                      ),
                      _NavItem(
                        icon: CupertinoIcons.square_grid_2x2,
                        activeIcon: CupertinoIcons.square_grid_2x2_fill,
                        label: '마켓',
                        selected: index == 1,
                        onTap: () => _onTap(context, 1),
                      ),
                      Expanded(
                        child: InkWell(
                          onTap: () => context.go('/sell'),
                          child: Align(
                            alignment: Alignment.bottomCenter,
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Text(
                                '판매',
                                maxLines: 1,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  height: 1.1,
                                  color: sellColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      _NavItem(
                        icon: CupertinoIcons.chat_bubble_2,
                        activeIcon: CupertinoIcons.chat_bubble_2_fill,
                        label: '채팅',
                        selected: index == 2,
                        onTap: () => _onTap(context, 2),
                      ),
                      _NavItem(
                        icon: CupertinoIcons.person,
                        activeIcon: CupertinoIcons.person_fill,
                        label: '마이',
                        selected: index == 3,
                        onTap: () => _onTap(context, 3),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                top: -_fabOverlap,
                child: Center(
                  child: GestureDetector(
                    onTap: () => context.go('/sell'),
                    child: Container(
                      width: _fabSize,
                      height: _fabSize,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: sellSelected
                            ? AppColors.accentBlue
                            : cf.surfaceVariant,
                        shape: BoxShape.circle,
                        boxShadow: sellSelected
                            ? [
                                BoxShadow(
                                  color: AppColors.accentBlue
                                      .withValues(alpha: 0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: CustomPaint(
                        size: const Size(30, 30),
                        painter: _PlusPainter(
                          color: sellSelected ? Colors.white : sellColor,
                          strokeWidth: 4,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color =
        selected ? AppColors.bottomNavActive : AppColors.bottomNavInactive;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(selected ? activeIcon : icon, color: color, size: 28),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                height: 1.1,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlusPainter extends CustomPainter {
  const _PlusPainter({required this.color, required this.strokeWidth});

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final t = strokeWidth;
    final cx = size.width / 2;
    final cy = size.height / 2;
    final radius = Radius.circular(t / 2);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(cx, cy), width: size.width, height: t),
        radius,
      ),
      paint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(cx, cy), width: t, height: size.height),
        radius,
      ),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _PlusPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}
