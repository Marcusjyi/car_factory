import 'package:flutter/material.dart';

/// 목업 DESIGN SPEC (DS-1) 컬러 토큰.
abstract final class AppColors {
  // Shared
  static const accentBlue = Color(0xFF2979FF);
  static const badgeUsed = Color(0xFF2979FF);
  static const badgeNew = Color(0xFF34C759);
  static const bottomNavActive = Color(0xFF2979FF);
  static const bottomNavInactive = Color(0xFF8E8E93);
  static const chatBubbleMine = Color(0xFF2979FF);
  static const countBadge = Color(0xFFFF2D55);
  static const textSecondary = Color(0xFF8E8E93);
  static const kakao = Color(0xFFFEE500);
  static const naver = Color(0xFF03C75A);

  // Light defaults (static fallbacks / login etc.)
  static const bg = Color(0xFFF2F2F7);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceVariant = Color(0xFFF2F2F7);
  static const border = Color(0xFFE5E5EA);
  static const text = Color(0xFF1C1C1E);
  static const danger = Color(0xFFFF3B30);

  // Legacy aliases (green brand removed — map to accent)
  static const brand = accentBlue;
  static const brandDark = Color(0xFF1A5FCC);
}

/// Theme-aware colors for dark/light mockups.
@immutable
class CfColors extends ThemeExtension<CfColors> {
  const CfColors({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.divider,
    required this.textPrimary,
    required this.textSecondary,
    required this.chatBubbleTheirs,
    required this.danger,
    required this.bottomNavBg,
  });

  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color divider;
  final Color textPrimary;
  final Color textSecondary;
  final Color chatBubbleTheirs;
  final Color danger;
  final Color bottomNavBg;

  static const light = CfColors(
    background: Color(0xFFF2F2F7),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF2F2F7),
    divider: Color(0xFFE5E5EA),
    textPrimary: Color(0xFF1C1C1E),
    textSecondary: Color(0xFF8E8E93),
    chatBubbleTheirs: Color(0xFFE8E8ED),
    danger: Color(0xFFFF3B30),
    bottomNavBg: Color(0xFFFFFFFF),
  );

  static const dark = CfColors(
    background: Color(0xFF000000),
    surface: Color(0xFF1C1C1E),
    surfaceVariant: Color(0xFF2C2C2E),
    divider: Color(0xFF3A3A3C),
    textPrimary: Color(0xFFFFFFFF),
    textSecondary: Color(0xFF8E8E93),
    chatBubbleTheirs: Color(0xFF2C2C2E),
    danger: Color(0xFFFF453A),
    bottomNavBg: Color(0xFF1C1C1E),
  );

  @override
  CfColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceVariant,
    Color? divider,
    Color? textPrimary,
    Color? textSecondary,
    Color? chatBubbleTheirs,
    Color? danger,
    Color? bottomNavBg,
  }) {
    return CfColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceVariant: surfaceVariant ?? this.surfaceVariant,
      divider: divider ?? this.divider,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      chatBubbleTheirs: chatBubbleTheirs ?? this.chatBubbleTheirs,
      danger: danger ?? this.danger,
      bottomNavBg: bottomNavBg ?? this.bottomNavBg,
    );
  }

  @override
  CfColors lerp(ThemeExtension<CfColors>? other, double t) {
    if (other is! CfColors) return this;
    return CfColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      divider: Color.lerp(divider, other.divider, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      chatBubbleTheirs: Color.lerp(chatBubbleTheirs, other.chatBubbleTheirs, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      bottomNavBg: Color.lerp(bottomNavBg, other.bottomNavBg, t)!,
    );
  }
}

extension CfThemeX on BuildContext {
  CfColors get cf => Theme.of(this).extension<CfColors>() ?? CfColors.light;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}

abstract final class AppTheme {
  static ThemeData light() => _build(Brightness.light, CfColors.light);

  static ThemeData dark() => _build(Brightness.dark, CfColors.dark);

  static ThemeData _build(Brightness brightness, CfColors cf) {
    final isDark = brightness == Brightness.dark;
    final base = ColorScheme.fromSeed(
      seedColor: AppColors.accentBlue,
      brightness: brightness,
      primary: AppColors.accentBlue,
      surface: cf.surface,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: base,
      scaffoldBackgroundColor: cf.background,
      extensions: [cf],
      appBarTheme: AppBarTheme(
        backgroundColor: cf.background,
        foregroundColor: cf.textPrimary,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: cf.textPrimary,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          height: 1.2,
        ),
      ),
      dividerColor: cf.divider,
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.accentBlue,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: cf.textPrimary,
          minimumSize: const Size.fromHeight(48),
          side: BorderSide(color: cf.divider),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cf.surfaceVariant,
        hintStyle: TextStyle(color: cf.textSecondary, fontSize: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.accentBlue, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: cf.bottomNavBg,
        indicatorColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: selected
                ? AppColors.bottomNavActive
                : AppColors.bottomNavInactive,
          );
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: cf.surfaceVariant,
        selectedColor: AppColors.accentBlue,
        labelStyle: TextStyle(color: cf.textPrimary, fontSize: 13),
        side: BorderSide(color: cf.divider),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      cardTheme: CardThemeData(
        color: cf.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: isDark ? Colors.transparent : cf.divider),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: cf.textSecondary,
        textColor: cf.textPrimary,
      ),
    );
  }
}
