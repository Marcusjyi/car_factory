import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/firebase/firebase_bootstrap.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/chat/chat_api.dart';
import '../../../shared/models/product.dart';
import '../product_repository.dart';

final _productProvider =
    FutureProvider.family<ProductPublicDto?, String>((ref, id) {
  return ProductRepository().getPublicProduct(id);
});

final _favoriteProvider =
    StreamProvider.family<bool, String>((ref, productId) {
  final auth = ref.watch(authControllerProvider);
  final uid = auth.firebaseUser?.uid;
  if (uid == null) {
    return Stream.value(false);
  }
  return FirebaseBootstrap.db
      .collection('users')
      .doc(uid)
      .collection('favorites')
      .doc(productId)
      .snapshots()
      .map((snap) => snap.exists);
});

/// 앱 세션당 1회 조회수 (웹 sessionStorage 대응)
final _viewedProductIds = <String>{};

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _galleryIndex = 0;
  int? _viewCountOverride;
  bool _chatBusy = false;
  bool _viewScheduled = false;

  Future<void> _toggleFavorite() async {
    final auth = ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated ||
        auth.firebaseUser == null) {
      context.push(
        '/login?next=${Uri.encodeComponent('/parts/${widget.productId}')}',
      );
      return;
    }
    final uid = auth.firebaseUser!.uid;
    final refDoc = FirebaseBootstrap.db
        .collection('users')
        .doc(uid)
        .collection('favorites')
        .doc(widget.productId);
    final snap = await refDoc.get();
    if (snap.exists) {
      await refDoc.delete();
    } else {
      await refDoc.set({
        'productId': widget.productId,
        'createdAt': FieldValue.serverTimestamp(),
      });
    }
  }

  Future<void> _maybeIncrementView(ProductPublicDto product) async {
    final auth = ref.read(authControllerProvider);
    if (auth.status == AuthStatus.loading) return;
    final uid = auth.firebaseUser?.uid;
    if (uid != null && uid == product.sellerUid) return;
    if (_viewedProductIds.contains(product.id)) return;
    _viewedProductIds.add(product.id);
    await ProductRepository().incrementViewCount(product.id);
    if (mounted) {
      setState(() {
        _viewCountOverride = product.viewCount + 1;
      });
    }
  }

  Future<void> _startChat() async {
    final auth = ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated) {
      context.push(
        '/login?next=${Uri.encodeComponent('/parts/${widget.productId}')}',
      );
      return;
    }
    setState(() => _chatBusy = true);
    try {
      final roomId =
          await ChatApi().getOrCreateChatRoom(productId: widget.productId);
      if (mounted) context.push('/chat/$roomId');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$e')),
        );
      }
    } finally {
      if (mounted) setState(() => _chatBusy = false);
    }
  }

  String _statusLabel(ProductStatus status) {
    switch (status) {
      case ProductStatus.reserved:
        return '예약중';
      case ProductStatus.sold:
        return '판매완료';
      default:
        return '판매중';
    }
  }

  String _registeredDate(DateTime? date) {
    if (date == null) return '-';
    return DateFormat('yyyy. MM. dd.').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_productProvider(widget.productId));
    final favorited =
        ref.watch(_favoriteProvider(widget.productId)).valueOrNull ?? false;
    final currency = NumberFormat('#,###');
    final cf = context.cf;

    return Scaffold(
      appBar: AppBar(
        title: const Text('상품 상세'),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
          child: Icon(
            CupertinoIcons.back,
            size: 28,
            color: cf.textPrimary,
          ),
        ),
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (product) {
          if (product == null) {
            return const Center(child: Text('상품을 찾을 수 없습니다.'));
          }

          if (!_viewScheduled) {
            _viewScheduled = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _maybeIncrementView(product);
            });
          }

          final imageUrls = <String>[
            for (final img in product.images)
              if (img.detailURL.isNotEmpty) img.detailURL,
          ];
          if (imageUrls.isEmpty && product.thumbnailURL.isNotEmpty) {
            imageUrls.add(product.thumbnailURL);
          }

          final viewCount = _viewCountOverride ?? product.viewCount;
          final title = product.title.isNotEmpty
              ? product.title
              : (product.partName.isNotEmpty
                  ? product.partName
                  : '상품');
          final sellerName = product.sellerDisplayName.trim().isNotEmpty
              ? product.sellerDisplayName.trim()
              : '판매자';

          return ListView(
            children: [
              // ── 갤러리 ──────────────────────────────────
              AspectRatio(
                aspectRatio: 4 / 3,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (imageUrls.isEmpty)
                      ColoredBox(
                        color: cf.surfaceVariant,
                        child: Icon(
                          CupertinoIcons.photo,
                          size: 48,
                          color: cf.textSecondary,
                        ),
                      )
                    else
                      PageView.builder(
                        itemCount: imageUrls.length,
                        onPageChanged: (i) =>
                            setState(() => _galleryIndex = i),
                        itemBuilder: (_, i) => CachedNetworkImage(
                          imageUrl: imageUrls[i],
                          fit: BoxFit.cover,
                          placeholder: (_, _) =>
                              ColoredBox(color: cf.surfaceVariant),
                          errorWidget: (_, _, _) => ColoredBox(
                            color: cf.surfaceVariant,
                            child: Icon(
                              CupertinoIcons.photo,
                              color: cf.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Material(
                        color: Colors.white.withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(8),
                        elevation: 1,
                        shadowColor: Colors.black26,
                        child: InkWell(
                          onTap: _toggleFavorite,
                          borderRadius: BorderRadius.circular(8),
                          child: SizedBox(
                            width: 40,
                            height: 40,
                            child: Icon(
                              favorited
                                  ? CupertinoIcons.heart_fill
                                  : CupertinoIcons.heart,
                              color: favorited
                                  ? AppColors.countBadge
                                  : cf.textSecondary,
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (imageUrls.length > 1)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 12,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(imageUrls.length, (i) {
                            final active = i == _galleryIndex;
                            return Container(
                              width: active ? 8 : 6,
                              height: active ? 8 : 6,
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: active
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.45),
                              ),
                            );
                          }),
                        ),
                      ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 상태 + 조회수
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.accentBlue,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _statusLabel(product.status),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: cf.surfaceVariant,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '조회 ${NumberFormat('#,###').format(viewCount)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: cf.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 제목(부품명)
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            height: 1.3,
                            color: cf.textPrimary,
                          ),
                    ),
                    const SizedBox(height: 6),

                    // 가격
                    Text(
                      '₩${currency.format(product.price)}',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                        color: cf.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // 배송비
                    Row(
                      children: [
                        Icon(
                          CupertinoIcons.cube_box,
                          size: 18,
                          color: cf.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          product.shippingLabel,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: cf.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 스펙 표
                    _SpecTable(
                      rows: [
                        _SpecRowData(
                          label: '상품 상태',
                          value: product.conditionLabel,
                          emphasis: true,
                        ),
                        _SpecRowData(
                          label: '상품 고유번호',
                          value: product.listingNumber?.isNotEmpty == true
                              ? product.listingNumber!
                              : '발급 중…',
                        ),
                        _SpecRowData(
                          label: '적용 연식',
                          value: (product.yearRange?.isNotEmpty == true)
                              ? product.yearRange!
                              : '-',
                        ),
                        _SpecRowData(
                          label: '부품번호',
                          value: (product.partNumber?.isNotEmpty == true)
                              ? product.partNumber!
                              : '-',
                        ),
                        _SpecRowData(
                          label: '등록일',
                          value: _registeredDate(product.createdAt),
                        ),
                        _SpecRowData(
                          label: '판매 지역',
                          value: (product.location?.isNotEmpty == true)
                              ? product.location!
                              : '전국',
                        ),
                        _SpecRowData(
                          label: '판매자',
                          value: sellerName,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // 상품 설명
                    Text(
                      '상품 설명',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: cf.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      product.description.trim().isNotEmpty
                          ? product.description.trim()
                          : '등록된 상품 설명이 없습니다.',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.55,
                        color: cf.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 채팅하기
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: FilledButton(
                        onPressed: _chatBusy ? null : _startChat,
                        child: _chatBusy
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('채팅하기'),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),
              Divider(height: 1, color: cf.divider),

              // ── 배송 및 환불 안내 ──────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '배송 및 환불 안내',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: cf.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '배송 안내',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: cf.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '결제 확인 후 1~2영업일 내 발송됩니다. 택배 및 화물택배 배송이 가능하며, 부피/무게에 따라 배송비가 달라질 수 있습니다.',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.55,
                        color: cf.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '환불/교환 안내',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: cf.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '단순 변심에 의한 환불은 상품 수령 후 7일 이내 가능합니다. 부품 특성상 설치/사용 흔적이 있는 경우 환불이 제한될 수 있습니다. 하자/오배송 시 전액 환불 또는 교환 처리됩니다.',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.55,
                        color: cf.textSecondary,
                      ),
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

class _SpecRowData {
  const _SpecRowData({
    required this.label,
    required this.value,
    this.emphasis = false,
  });

  final String label;
  final String value;
  final bool emphasis;
}

class _SpecTable extends StatelessWidget {
  const _SpecTable({required this.rows});

  final List<_SpecRowData> rows;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Column(
      children: [
        for (var i = 0; i < rows.length; i++) ...[
          if (i > 0) Divider(height: 1, color: cf.divider),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 100,
                  child: Text(
                    rows[i].label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: cf.textSecondary,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    rows[i].value,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          rows[i].emphasis ? FontWeight.w700 : FontWeight.w500,
                      color: cf.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
