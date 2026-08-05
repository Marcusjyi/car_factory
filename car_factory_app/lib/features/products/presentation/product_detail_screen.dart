import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/chat/chat_api.dart';
import '../../../shared/models/product.dart';
import '../product_repository.dart';

final _productProvider =
    FutureProvider.family<ProductPublicDto?, String>((ref, id) {
  return ProductRepository().getPublicProduct(id);
});

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_productProvider(productId));
    final auth = ref.watch(authControllerProvider);
    final currency = NumberFormat('#,###');

    return Scaffold(
      appBar: AppBar(title: const Text('상품 상세')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (product) {
          if (product == null) {
            return const Center(child: Text('상품을 찾을 수 없습니다.'));
          }
          final image = product.images.isNotEmpty
              ? product.images.first.downloadURL
              : product.thumbnailURL;

          return ListView(
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: image.isEmpty
                    ? const ColoredBox(
                        color: AppColors.bg,
                        child: Icon(Icons.image_outlined, size: 48),
                      )
                    : Image.network(image, fit: BoxFit.cover),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (product.status == ProductStatus.reserved)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 8),
                        child: Text(
                          '예약중',
                          style: TextStyle(
                            color: AppColors.brand,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    Text(
                      product.title,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${currency.format(product.price)}원',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${product.manufacturer} · ${product.vehicleModelName}',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    if (product.listingNumber != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '고유번호 ${product.listingNumber}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Text(
                      '판매자 ${product.sellerDisplayName}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () async {
                        if (auth.status != AuthStatus.authenticated) {
                          context.push(
                            '/login?next=${Uri.encodeComponent('/parts/$productId')}',
                          );
                          return;
                        }
                        try {
                          final roomId = await ChatApi()
                              .getOrCreateChatRoom(productId: productId);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('채팅방 준비됨: $roomId')),
                            );
                            context.go('/chat');
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('$e')),
                            );
                          }
                        }
                      },
                      child: const Text('채팅하기'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
