import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../shell/presentation/main_shell.dart';
import '../../products/product_repository.dart';
import '../../../shared/models/product.dart';

final _homeProductsProvider = FutureProvider<List<ProductPublicDto>>((ref) {
  return ProductRepository().listProducts(
    const ProductSearchFilter(limit: 12),
  );
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(_homeProductsProvider);
    final currency = NumberFormat('#,###');

    return Scaffold(
      appBar: cfAppBar(context),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_homeProductsProvider),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.brandDark, AppColors.brand],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '카팩토리',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '중고 자동차 부품, 직거래로 안전하게',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.brandDark,
                    ),
                    onPressed: () => context.go('/parts'),
                    child: const Text('부품 찾아보기'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  '최신 매물',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => context.go('/parts'),
                  child: const Text('전체'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            products.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  '상품을 불러오지 못했습니다.\nFirebase 설정을 확인하세요.\n$e',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Text(
                      '등록된 판매중 상품이 없습니다.',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  );
                }
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: items.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  itemBuilder: (context, i) {
                    final p = items[i];
                    return _ProductCard(
                      product: p,
                      priceLabel: '${currency.format(p.price)}원',
                      onTap: () => context.push('/parts/${p.id}'),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.product,
    required this.priceLabel,
    required this.onTap,
  });

  final ProductPublicDto product;
  final String priceLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = product.thumbnailURL.isNotEmpty
        ? product.thumbnailURL
        : (product.images.isNotEmpty ? product.images.first.cardURL : '');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Ink(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: image.isEmpty
                    ? Container(
                        color: AppColors.bg,
                        child: const Icon(Icons.image_not_supported_outlined),
                      )
                    : Image.network(image, fit: BoxFit.cover),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (product.status == ProductStatus.reserved)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Text(
                        '예약중',
                        style: TextStyle(
                          color: AppColors.brand,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  Text(
                    product.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    priceLabel,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
