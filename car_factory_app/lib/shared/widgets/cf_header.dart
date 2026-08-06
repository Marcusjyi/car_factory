import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../constants/categories.dart';

/// 탭·폼 스크린 이름 — 전역 통일 타이포.
class CfPageTitle extends StatelessWidget {
  const CfPageTitle(
    this.text, {
    super.key,
    this.center = false,
  });

  static const double fontSize = 22;
  static const FontWeight fontWeight = FontWeight.w800;

  final String text;
  final bool center;

  static TextStyle styleOf(BuildContext context) {
    return TextStyle(
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: 1.2,
      color: context.cf.textPrimary,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: center ? TextAlign.center : TextAlign.start,
      style: styleOf(context),
    );
  }
}

/// CAR FACTORY 로고 — "F"만 accentBlue (DS-2).
class CfLogo extends StatelessWidget {
  const CfLogo({super.key, this.fontSize = 22});

  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final color = context.cf.textPrimary;
    final style = TextStyle(
      fontSize: fontSize,
      fontWeight: FontWeight.w900,
      fontStyle: FontStyle.italic,
      letterSpacing: -0.5,
      height: 1,
      color: color,
    );
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(text: 'CAR ', style: style),
          TextSpan(
            text: 'F',
            style: style.copyWith(color: AppColors.accentBlue),
          ),
          TextSpan(text: 'ACTORY', style: style),
        ],
      ),
    );
  }
}

/// 로고 + 알림 벨 헤더 (홈/마이페이지).
class CfHeader extends StatelessWidget {
  const CfHeader({
    super.key,
    this.showBell = true,
    this.trailing,
    this.onBellTap,
  });

  final bool showBell;
  final Widget? trailing;
  final VoidCallback? onBellTap;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return ColoredBox(
      color: cf.background,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Row(
          children: [
            const CfLogo(),
            const Spacer(),
            if (trailing != null)
              trailing!
            else if (showBell)
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    onPressed: onBellTap ?? () {},
                    padding: EdgeInsets.zero,
                    constraints:
                        const BoxConstraints(minWidth: 40, minHeight: 40),
                    icon: Icon(
                      CupertinoIcons.bell,
                      color: cf.textPrimary,
                      size: 24,
                    ),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppColors.accentBlue,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

/// 검색바 (홈: 탭만, 검색: 입력).
class CfSearchBar extends StatelessWidget {
  const CfSearchBar({
    super.key,
    this.readOnly = false,
    this.controller,
    this.onTap,
    this.onSubmitted,
    this.onChanged,
  });

  final bool readOnly;
  final TextEditingController? controller;
  final VoidCallback? onTap;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    const searchAccent = Color(0xFF464646);
    const outline = BorderSide(color: searchAccent, width: 1);
    return SizedBox(
      height: 44,
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        onTap: onTap,
        onSubmitted: onSubmitted,
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        style: TextStyle(color: cf.textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: '차종, 부품명, 파츠번호 검색',
          hintStyle: TextStyle(color: cf.textSecondary, fontSize: 14),
          suffixIcon: const Icon(
            CupertinoIcons.search,
            color: searchAccent,
            size: 20,
          ),
          filled: true,
          fillColor: cf.surfaceVariant,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(22),
            borderSide: outline,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(22),
            borderSide: outline,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(22),
            borderSide: readOnly
                ? outline
                : const BorderSide(color: searchAccent, width: 1),
          ),
        ),
      ),
    );
  }
}

/// 홈/검색 공용 카테고리 (웹 id·정식명 동일, 칩은 shortLabel).
class PartCategory {
  const PartCategory(
    this.id,
    this.label,
    this.icon, {
    this.shortLabel,
    this.assetFile,
  });

  final String id;
  final String label;
  final IconData icon;
  final String? shortLabel;
  final String? assetFile;

  String get displayLabel => shortLabel ?? label;

  String? assetPath(Brightness brightness) {
    final file = assetFile;
    if (file == null || file.isEmpty) return null;
    final folder = brightness == Brightness.dark
        ? 'category_darkMode'
        : 'category_lightMode';
    return 'assets/$folder/$file.png';
  }

  factory PartCategory.fromGroup(CategoryGroup g) => PartCategory(
        g.id,
        g.label,
        g.icon,
        shortLabel: g.shortLabel,
        assetFile: g.assetFile,
      );
}

final kPartCategories =
    kCategoryGroups.map(PartCategory.fromGroup).toList(growable: false);

/// 검색 탭 대분류 — 웹과 동일 id, 짧은 표시명.
final kSearchCategories = kPartCategories;

/// 홈 — 대분류 + 장착점.
final kHomeCategories = <PartCategory>[
  ...kPartCategories,
  const PartCategory('installer', '장착점', CupertinoIcons.wrench),
];

class CategoryIconsRow extends StatelessWidget {
  const CategoryIconsRow({
    super.key,
    this.categories,
    this.onSelected,
    this.textOnTop = false,
    this.showImage = true,
    this.selectedCategoryId,
    this.navigateOnTap = true,
  });

  final List<PartCategory>? categories;
  final ValueChanged<PartCategory>? onSelected;
  /// 검색 화면: 라벨 위 · 컨테이너 아래.
  final bool textOnTop;
  /// false면 이미지 없이 빈 컨테이너만 표시.
  final bool showImage;
  final String? selectedCategoryId;
  final bool navigateOnTap;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    final brightness = Theme.of(context).brightness;
    final items = categories ?? kHomeCategories;
    return SizedBox(
      height: textOnTop && !showImage ? 56 : (textOnTop ? 88 : 92),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final c = items[i];
          final isInstaller = c.id == 'installer';
          final selected = selectedCategoryId == c.id;
          final asset = showImage ? c.assetPath(brightness) : null;

          final borderWidth = selected ? 1.5 : 1.0;
          final radius = 8.0;
          final box = Container(
            width: showImage ? 60 : 64,
            height: showImage ? 60 : 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected
                  ? AppColors.accentBlue.withValues(alpha: 0.12)
                  : (isInstaller
                      ? AppColors.accentBlue.withValues(alpha: 0.15)
                      : cf.surfaceVariant),
              borderRadius: BorderRadius.circular(radius),
              border: Border.all(
                color: selected
                    ? AppColors.accentBlue
                    : const Color(0xFFE5E5EA),
                width: borderWidth,
              ),
            ),
            child: showImage
                ? ClipRRect(
                    borderRadius:
                        BorderRadius.circular(radius - borderWidth),
                    child: asset != null
                        ? Image.asset(
                            asset,
                            width: 60,
                            height: 60,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Icon(
                              c.icon,
                              color: cf.textPrimary,
                              size: 26,
                            ),
                          )
                        : SizedBox(
                            width: 60,
                            height: 60,
                            child: Icon(
                              c.icon,
                              color: isInstaller
                                  ? AppColors.accentBlue
                                  : cf.textPrimary,
                              size: 26,
                            ),
                          ),
                  )
                : null,
          );

          final label = Text(
            c.displayLabel,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              fontWeight: selected || isInstaller
                  ? FontWeight.w600
                  : FontWeight.w500,
              color: selected || isInstaller
                  ? AppColors.accentBlue
                  : cf.textPrimary,
            ),
          );

          return GestureDetector(
            onTap: () {
              onSelected?.call(c);
              if (isInstaller || !navigateOnTap) return;
              context.go('/parts?category=${c.id}');
            },
            child: SizedBox(
              width: showImage ? 68 : 64,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: textOnTop
                    ? [
                        label,
                        const SizedBox(height: 6),
                        box,
                      ]
                    : [
                        box,
                        const SizedBox(height: 6),
                        label,
                      ],
              ),
            ),
          );
        },
      ),
    );
  }
}
