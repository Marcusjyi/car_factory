import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../../shared/widgets/cf_header.dart';
import '../../auth/auth_controller.dart';

class MyPageScreen extends ConsumerWidget {
  const MyPageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final cf = context.cf;
    final profile = auth.profile;
    final name = profile?.displayName.isNotEmpty == true
        ? profile!.displayName
        : '닉네임 미설정';

    return Scaffold(
      backgroundColor: cf.background,
      body: SafeArea(
        bottom: false,
        child: auth.status != AuthStatus.authenticated
            ? ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const CfHeader(),
                  const SizedBox(height: 8),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: CfPageTitle('마이페이지'),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cf.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: cf.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '로그인이 필요합니다',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: cf.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '소셜 로그인 후 판매·채팅·거래를 이용할 수 있습니다.',
                          style: TextStyle(color: cf.textSecondary),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () =>
                              context.push('/login?next=/mypage'),
                          child: const Text('로그인'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: cf.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: cf.divider),
                    ),
                    child: _DarkModeTile(
                      isDark: themeMode == ThemeMode.dark,
                      onChanged: (v) => ref
                          .read(themeModeProvider.notifier)
                          .setThemeMode(
                            v ? ThemeMode.dark : ThemeMode.light,
                          ),
                    ),
                  ),
                ],
              )
            : ListView(
                padding: const EdgeInsets.only(bottom: 32),
                children: [
                  const CfHeader(),
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: CfPageTitle('마이페이지'),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _ProfileCard(
                      name: name,
                      photoURL: profile?.photoURL,
                      region: profile?.defaultRegion,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _StatusCard(),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: cf.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: cf.divider),
                      ),
                      child: Column(
                        children: [
                          _MenuTile(
                            icon: CupertinoIcons.tag,
                            label: '내 판매상품',
                            count: 0,
                            countColor: AppColors.accentBlue,
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.heart,
                            label: '관심상품',
                            count: 0,
                            countColor: AppColors.countBadge,
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.doc_text,
                            label: '주문/거래내역',
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.calendar,
                            label: '장착 예약',
                            count: 0,
                            countColor: AppColors.accentBlue,
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.bell,
                            label: '알림',
                            count: 0,
                            countColor: AppColors.countBadge,
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.eye,
                            label: '최근 본 상품',
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _DarkModeTile(
                            isDark: themeMode == ThemeMode.dark,
                            onChanged: (v) => ref
                                .read(themeModeProvider.notifier)
                                .setThemeMode(
                                  v ? ThemeMode.dark : ThemeMode.light,
                                ),
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.gear,
                            label: '설정',
                            onTap: () {},
                          ),
                          Divider(height: 1, color: cf.divider),
                          _MenuTile(
                            icon: CupertinoIcons.square_arrow_right,
                            label: '로그아웃',
                            onTap: () => ref
                                .read(authControllerProvider.notifier)
                                .signOut(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.name,
    this.photoURL,
    this.region,
  });

  final String name;
  final String? photoURL;
  final String? region;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Container(
      decoration: BoxDecoration(
        color: cf.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cf.divider),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            height: 100,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF1A1A1C),
                  AppColors.accentBlue.withValues(alpha: 0.5),
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -30),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: cf.surfaceVariant,
                        backgroundImage: photoURL != null && photoURL!.isNotEmpty
                            ? NetworkImage(photoURL!)
                            : null,
                        child: photoURL == null || photoURL!.isEmpty
                            ? Text(
                                name.isNotEmpty ? name[0].toUpperCase() : '?',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 22,
                                  color: AppColors.accentBlue,
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: cf.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: cf.divider),
                          ),
                          child: const Icon(
                            CupertinoIcons.camera_fill,
                            size: 12,
                            color: AppColors.accentBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 34),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  name,
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: cf.textPrimary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                CupertinoIcons.checkmark_seal_fill,
                                size: 18,
                                color: AppColors.accentBlue,
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '좋은 부품, 정직한 거래\n믿을 수 있는 카라이프를 만들어요.',
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.35,
                              color: cf.textSecondary,
                            ),
                          ),
                          if (region != null && region!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              region!,
                              style: TextStyle(
                                fontSize: 12,
                                color: cf.textSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 40),
                    child: Icon(
                      CupertinoIcons.chevron_right,
                      color: cf.textSecondary,
                      size: 18,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 14),
      decoration: BoxDecoration(
        color: cf.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cf.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '나의 현황',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: cf.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: const [
              Expanded(
                child: _StatItem(
                  icon: CupertinoIcons.cart,
                  iconColor: AppColors.accentBlue,
                  value: '0',
                  label: '진행 중 거래',
                ),
              ),
              Expanded(
                child: _StatItem(
                  icon: CupertinoIcons.heart_fill,
                  iconColor: AppColors.countBadge,
                  value: '0',
                  label: '관심상품',
                ),
              ),
              Expanded(
                child: _StatItem(
                  icon: CupertinoIcons.calendar,
                  iconColor: AppColors.accentBlue,
                  value: '0',
                  label: '장착 예약',
                ),
              ),
              Expanded(
                child: _StatItem(
                  icon: CupertinoIcons.bell,
                  iconColor: AppColors.accentBlue,
                  value: '0',
                  label: '읽지 않은 알림',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Column(
      children: [
        Icon(icon, color: iconColor, size: 24),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: cf.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 11, color: cf.textSecondary),
        ),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.count,
    this.countColor,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int? count;
  final Color? countColor;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        height: 52,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            children: [
              Icon(icon, size: 22, color: cf.textSecondary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: cf.textPrimary,
                  ),
                ),
              ),
              if (count != null && count! > 0)
                Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: countColor ?? AppColors.accentBlue,
                  ),
                ),
              const SizedBox(width: 6),
              Icon(
                CupertinoIcons.chevron_right,
                size: 16,
                color: cf.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DarkModeTile extends StatelessWidget {
  const _DarkModeTile({
    required this.isDark,
    required this.onChanged,
  });

  final bool isDark;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return SizedBox(
      height: 52,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            Icon(
              isDark ? CupertinoIcons.moon_fill : CupertinoIcons.sun_max_fill,
              size: 22,
              color: cf.textSecondary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '다크 모드',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: cf.textPrimary,
                ),
              ),
            ),
            Switch.adaptive(
              value: isDark,
              activeColor: AppColors.accentBlue,
              onChanged: onChanged,
            ),
          ],
        ),
      ),
    );
  }
}
