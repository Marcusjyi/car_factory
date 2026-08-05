import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/auth_controller.dart';
import '../../shell/presentation/main_shell.dart';

class MyPageScreen extends ConsumerWidget {
  const MyPageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: cfAppBar(context, title: '마이페이지'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (auth.status != AuthStatus.authenticated)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '로그인이 필요합니다',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '소셜 로그인 후 판매·채팅·거래를 이용할 수 있습니다.',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.push('/login?next=/mypage'),
                      child: const Text('로그인'),
                    ),
                  ],
                ),
              ),
            )
          else ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: AppColors.brand.withValues(alpha: 0.15),
                child: Text(
                  (auth.profile?.displayName.isNotEmpty == true
                          ? auth.profile!.displayName[0]
                          : '?')
                      .toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.brand,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              title: Text(
                auth.profile?.displayName.isNotEmpty == true
                    ? auth.profile!.displayName
                    : '닉네임 미설정',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text(auth.firebaseUser?.email ?? auth.firebaseUser?.uid ?? ''),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: const Text('내 판매 상품'),
              onTap: () {},
            ),
            ListTile(
              leading: const Icon(Icons.receipt_long_outlined),
              title: const Text('거래 내역'),
              onTap: () {},
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('로그아웃'),
              onTap: () =>
                  ref.read(authControllerProvider.notifier).signOut(),
            ),
          ],
        ],
      ),
    );
  }
}
