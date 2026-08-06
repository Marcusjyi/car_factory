import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  String? _pending;
  String? _error;

  Future<void> _run(String key, Future<void> Function() action) async {
    setState(() {
      _pending = key;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      final authMsg = ref.read(authControllerProvider).errorMessage;
      setState(() {
        _error = (authMsg != null && authMsg.isNotEmpty)
            ? authMsg
            : e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _pending = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('로그인')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            '카팩토리에 오신 것을 환영합니다',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 28),
          if (_error != null || auth.errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE4E2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _error ?? auth.errorMessage!,
                style: const TextStyle(color: AppColors.danger),
              ),
            ),
            const SizedBox(height: 16),
          ],
          _SocialButton(
            label: '카카오로 계속하기',
            background: AppColors.kakao,
            foreground: Colors.black87,
            loading: _pending == 'kakao',
            onPressed: () => _run(
              'kakao',
              () => ref.read(authControllerProvider.notifier).signInWithKakao(),
            ),
          ),
          const SizedBox(height: 10),
          _SocialButton(
            label: '네이버로 계속하기',
            background: AppColors.naver,
            foreground: Colors.white,
            loading: _pending == 'naver',
            onPressed: () => _run(
              'naver',
              () => ref.read(authControllerProvider.notifier).signInWithNaver(),
            ),
          ),
          const SizedBox(height: 10),
          _SocialButton(
            label: 'Google로 계속하기',
            background: Colors.white,
            foreground: AppColors.text,
            border: true,
            loading: _pending == 'google',
            onPressed: () => _run(
              'google',
              () =>
                  ref.read(authControllerProvider.notifier).signInWithGoogle(),
            ),
          ),
          const SizedBox(height: 24),
          TextButton(
            onPressed: () => context.go('/'),
            child: const Text('로그인 없이 둘러보기'),
          ),
        ],
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.label,
    required this.background,
    required this.foreground,
    required this.onPressed,
    this.loading = false,
    this.border = false,
  });

  final String label;
  final Color background;
  final Color foreground;
  final VoidCallback onPressed;
  final bool loading;
  final bool border;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: background,
          foregroundColor: foreground,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: border
                ? const BorderSide(color: AppColors.border)
                : BorderSide.none,
          ),
        ),
        child: loading
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: foreground,
                ),
              )
            : Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
      ),
    );
  }
}
