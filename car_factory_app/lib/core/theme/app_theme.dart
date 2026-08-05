import 'package:flutter/material.dart';

/// 카팩토리 앱 기본 테마 (스토어와 톤을 맞춤).
abstract final class AppColors {
  static const brand = Color(0xFF1A5F4A);
  static const brandDark = Color(0xFF0F3D30);
  static const bg = Color(0xFFF6F7F5);
  static const surface = Color(0xFFFFFFFF);
  static const text = Color(0xFF1A1C1B);
  static const textSecondary = Color(0xFF5C635F);
  static const border = Color(0xFFE2E6E3);
  static const danger = Color(0xFFB42318);
  static const kakao = Color(0xFFFEE500);
  static const naver = Color(0xFF03C75A);
}

abstract final class AppTheme {
  static ThemeData light() {
    final base = ColorScheme.fromSeed(
      seedColor: AppColors.brand,
      brightness: Brightness.light,
      primary: AppColors.brand,
      surface: AppColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: base,
      scaffoldBackgroundColor: AppColors.bg,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.text,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.text,
          fontSize: 18,
          fontWeight: FontWeight.w800,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.brand,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: Color(0xFFD8EDE5),
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
