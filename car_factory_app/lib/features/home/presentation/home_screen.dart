import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
          onRefresh: () async => ref.invalidate(_homeProductsProvider),
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
                    const cardWidth = 140.0;
                    // 4:3 이미지 + 본문(메이커·부품명2줄·금액·등록일)
                    const listHeight = cardWidth * 3 / 4 + 108;
                    return SizedBox(
                      height: listHeight,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: items.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, i) {
                          final p = items[i];
                          return ProductCard(
                            product: p,
                            width: cardWidth,
                            onTap: () => context.push('/parts/${p.id}'),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
              SliverToBoxAdapter(
                child: _SectionHeader(
                  title: '내 주변 장착점',
                  onViewAll: () {},
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 12)),
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: _ShopCard(),
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

class _ShopCard extends StatelessWidget {
  const _ShopCard();

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cf.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cf.divider),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: ColoredBox(
              color: cf.surfaceVariant,
              child: SizedBox(
                width: 64,
                height: 64,
                child: Icon(CupertinoIcons.building_2_fill, color: cf.textSecondary),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      '카팩토리 안산점',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: cf.textPrimary,
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
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      CupertinoIcons.star_fill,
                      size: 14,
                      color: Color(0xFFFFCC00),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '4.8 (128) | 9.2km',
                      style: TextStyle(fontSize: 12, color: cf.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '엔진, 미션, 하체 전문 장착',
                  style: TextStyle(fontSize: 12, color: cf.textSecondary),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: const [
                    _TagChip('정품 부품 취급'),
                    _TagChip('당일 장착 가능'),
                    _TagChip('보증 서비스'),
                  ],
                ),
              ],
            ),
          ),
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: cf.surfaceVariant,
              shape: BoxShape.circle,
            ),
            child: Icon(
              CupertinoIcons.chevron_right,
              size: 14,
              color: cf.textSecondary,
            ),
          ),
        ],
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
