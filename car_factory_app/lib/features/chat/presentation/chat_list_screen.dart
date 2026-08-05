import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/auth_controller.dart';
import '../../shell/presentation/main_shell.dart';

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: cfAppBar(context, title: '채팅'),
      body: auth.status != AuthStatus.authenticated
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('채팅은 로그인 후 이용할 수 있습니다.'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.push('/login?next=/chat'),
                    child: const Text('로그인'),
                  ),
                ],
              ),
            )
          : const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  '채팅 목록은 Firestore chatRooms 실시간 구독으로 이어서 구현합니다.\n'
                  '방 생성은 getOrCreateChatRoom Callable을 사용합니다.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
              ),
            ),
    );
  }
}
