import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/partners/partners_repository.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/cf_header.dart';
import '../../../shared/widgets/product_card.dart';
import '../../products/product_repository.dart';

final _homeProductsProvider = FutureProvider<List<ProductPublicDto>>((ref) {
  return ProductRepository().listProducts(
    const ProductSearchFilter(limit: 12),
  );
});

final _featuredPartnerProvider = FutureProvider<PartnerShop?>((ref) {
  return PartnersRepository.fetchFeatured();
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _bannerController = PageController();
  int _bannerIndex = 0;

  static const _banners = [
    (
      title: '중고 부품: 더 스마트한 선택',
      subtitle: '믿을 수 있는 중고 부품 거래 플랫폼',
    ),
    (
      title: '검증된 부품만 거래하세요',
      subtitle: '직거래·택배, 원하는 방식으로',
    ),
    (
      title: '주변 장착점과 함께',
      subtitle: '구매부터 장착까지 원스톱',
    ),
    (
      title: '오늘 등록된 새 매물',
      subtitle: '지금 바로 둘러보세요',
    ),
  ];

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final products = ref.watch(_homeProductsProvider);
    final cf = context.cf;

    return Scaffold(
      backgroundColor: cf.background,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(_homeProductsProvider);
            ref.invalidate(_featuredPartnerProvider);
          },
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CfHeader(),
                    const SizedBox(height: 16),
                    _HeroBanner(
                      controller: _bannerController,
                      banners: _banners,
                      index: _bannerIndex,
                      onPageChanged: (i) => setState(() => _bannerIndex = i),
                      onBrowse: () => context.go('/parts'),
                    ),
                    const SizedBox(height: 24),
                    CategoryIconsRow(
                      onSelected: (c) {
                        if (c.id == 'installer') return;
                      },
                    ),
                    const SizedBox(height: 24),
                    _SectionHeader(
                      title: '최근 등록된 부품',
                      onViewAll: () => context.go('/parts'),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
              SliverToBoxAdapter(
                child: products.when(
                  loading: () => const SizedBox(
                    height: 220,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      '상품을 불러오지 못했습니다.\n$e',
                      style: TextStyle(color: cf.textSecondary),
                    ),
                  ),
                  data: (items) {
                    if (items.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          '등록된 판매중 상품이 없습니다.',
                          style: TextStyle(color: cf.textSecondary),
                        ),
                      );
                    }
                    final cardWidth = ProductCard.horizontalCardWidth(context);
                    final listHeight =
                        ProductCard.horizontalListHeight(context, cardWidth);
                    return SizedBox(
                      height: listHeight,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: items.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, i) {
                          final p = items[i];
                          return Align(
                            alignment: Alignment.topCenter,
                            child: ProductCard(
                              product: p,
                              width: cardWidth,
                              onTap: () => context.push('/parts/${p.id}'),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Row(
                    children: [
                      Text(
                        '카팩토리 파트너스',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: context.cf.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {},
                        child: Text(
                          '장착점 찾기 >',
                          style: TextStyle(
                            fontSize: 13,
                            color: context.cf.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: _ShopBannerImage(),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 12)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Consumer(
                    builder: (context, ref, _) {
                      final partnerAsync = ref.watch(_featuredPartnerProvider);
                      return partnerAsync.when(
                        data: (partner) => _ShopCard(partner: partner),
                        loading: () => const _ShopCard(partner: null),
                        error: (_, _) => const _ShopCard(partner: null),
                      );
                    },
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onViewAll});

  final String title;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: cf.textPrimary,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: onViewAll,
            child: Text(
              '전체보기 >',
              style: TextStyle(fontSize: 13, color: cf.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({
    required this.controller,
    required this.banners,
    required this.index,
    required this.onPageChanged,
    required this.onBrowse,
  });

  final PageController controller;
  final List<({String title, String subtitle})> banners;
  final int index;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            children: [
              PageView.builder(
                controller: controller,
                itemCount: banners.length,
                onPageChanged: onPageChanged,
                itemBuilder: (context, i) {
                  final b = banners[i];
                  return Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF1A1A1C),
                          AppColors.accentBlue.withValues(alpha: 0.55),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          b.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          b.subtitle,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: onBrowse,
                          child: const Text(
                            '지금 둘러보기 →',
                            style: TextStyle(
                              color: AppColors.accentBlue,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              Positioned(
                bottom: 10,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(banners.length, (i) {
                    final active = i == index;
                    return Container(
                      width: 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: active
                            ? AppColors.accentBlue
                            : Colors.white.withValues(alpha: 0.4),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 장착점 배너 이미지 (카드와 분리)
class _ShopBannerImage extends StatelessWidget {
  const _ShopBannerImage();

  static const _darkAsset = 'assets/shops/uijeongbu.png';
  static const _lightAsset = 'assets/shops/uijeongbu_light.png';

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryLine = isDark ? Colors.white : const Color(0xFF111111);
    final subtitleColor = isDark
        ? Colors.white.withValues(alpha: 0.72)
        : const Color(0xFF464646);

    return Container(
      foregroundDecoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cf.divider),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                isDark ? _darkAsset : _lightAsset,
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
                filterQuality: FilterQuality.medium,
                errorBuilder: (_, _, _) => ColoredBox(
                  color: cf.surfaceVariant,
                  child: Icon(
                    CupertinoIcons.building_2_fill,
                    color: cf.textSecondary,
                    size: 40,
                  ),
                ),
              ),
              // 왼쪽 가독성용 그라데이션
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: isDark
                        ? const [
                            Color(0xE6000000),
                            Color(0x99000000),
                            Color(0x00000000),
                          ]
                        : const [
                            Color(0xF2FFFFFF),
                            Color(0xCCFFFFFF),
                            Color(0x00FFFFFF),
                          ],
                    stops: const [0.0, 0.42, 0.72],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final titleSize =
                        (constraints.maxHeight * 0.125).clamp(16.0, 22.0);
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text.rich(
                            TextSpan(
                              style: TextStyle(
                                fontSize: titleSize,
                                fontWeight: FontWeight.w900,
                                height: 1.18,
                                letterSpacing: -0.4,
                              ),
                              children: [
                                TextSpan(
                                  text: '부품은\n',
                                  style: TextStyle(color: primaryLine),
                                ),
                                const TextSpan(
                                  text: '쉽게\n',
                                  style: TextStyle(
                                    color: AppColors.accentBlue,
                                  ),
                                ),
                                TextSpan(
                                  text: '장착은\n',
                                  style: TextStyle(color: primaryLine),
                                ),
                                const TextSpan(
                                  text: '믿음직하게',
                                  style: TextStyle(
                                    color: AppColors.accentBlue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: titleSize * 0.28),
                          Text(
                            '믿을 수 있는 장착 서비스',
                            style: TextStyle(
                              fontSize: (titleSize * 0.52).clamp(11.0, 13.0),
                              fontWeight: FontWeight.w500,
                              color: subtitleColor,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShopCard extends StatelessWidget {
  const _ShopCard({this.partner});

  final PartnerShop? partner;

  /// 카드 고정 높이 — 사진도 동일 변의 1:1
  static const double _cardHeight = 132;

  static const _darkAsset = 'assets/shops/uijeongbu.png';
  static const _lightAsset = 'assets/shops/uijeongbu_light.png';

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final name = partner?.name.trim().isNotEmpty == true
        ? partner!.name
        : '카팩토리 김포점 (본점)';
    final specialty = partner?.specialtyLabel.trim().isNotEmpty == true
        ? partner!.specialtyLabel
        : '수입차 엔진, 미션, 오버홀 전문';
    final address = partner?.address.trim().isNotEmpty == true
        ? partner!.address
        : '경기도 김포시 통진읍 월하로 120';
    final badges = partner?.badges.isNotEmpty == true
        ? partner!.badges
        : const ['당일 예약 가능', '보증 서비스'];
    final ratingAvg = partner?.ratingAverage ?? 4.8;
    final ratingCount = partner?.ratingCount ?? 128;
    final photoURL = partner?.photoURL.trim() ?? '';
    final ratingText = ratingCount > 0
        ? '${ratingAvg.toStringAsFixed(1)} ($ratingCount)'
        : ratingAvg > 0
            ? ratingAvg.toStringAsFixed(1)
            : '';

    final fallback = ColoredBox(
      color: cf.surfaceVariant,
      child: Icon(
        CupertinoIcons.building_2_fill,
        color: cf.textSecondary,
      ),
    );

    final Widget photoChild;
    if (photoURL.isNotEmpty) {
      photoChild = CachedNetworkImage(
        imageUrl: photoURL,
        fit: BoxFit.cover,
        alignment: Alignment.center,
        width: _cardHeight,
        height: _cardHeight,
        memCacheWidth: (_cardHeight * 2).round(),
        errorWidget: (_, _, _) => Image.asset(
          isDark ? _darkAsset : _lightAsset,
          fit: BoxFit.cover,
          width: _cardHeight,
          height: _cardHeight,
        ),
        placeholder: (_, _) => ColoredBox(color: cf.surfaceVariant),
      );
    } else {
      photoChild = Image.asset(
        isDark ? _darkAsset : _lightAsset,
        fit: BoxFit.cover,
        width: _cardHeight,
        height: _cardHeight,
        filterQuality: FilterQuality.medium,
        errorBuilder: (_, _, _) => fallback,
      );
    }

    return Material(
      color: cf.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: cf.divider),
      ),
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        height: _cardHeight,
        width: double.infinity,
        child: Row(
          children: [
            SizedBox(
              width: _cardHeight,
              height: _cardHeight,
              child: photoChild,
            ),
            Expanded(
              child: SizedBox(
                height: _cardHeight,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: cf.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            CupertinoIcons.checkmark_seal_fill,
                            size: 16,
                            color: AppColors.accentBlue,
                          ),
                        ],
                      ),
                      if (ratingText.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            const Icon(
                              CupertinoIcons.star_fill,
                              size: 14,
                              color: Color(0xFFFFCC00),
                            ),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                ratingText,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cf.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 3),
                      Text(
                        specialty,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: cf.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        address,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: cf.textSecondary,
                        ),
                      ),
                      if (badges.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              for (final b in badges.take(3)) ...[
                                _TagChip(b),
                                const SizedBox(width: 6),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  const _TagChip(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.accentBlue.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: AppColors.accentBlue,
        ),
      ),
    );
  }
}
