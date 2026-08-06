import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_theme.dart';
import '../models/product.dart';

final _priceFormat = NumberFormat('#,###');

String formatWon(int price) => '₩${_priceFormat.format(price)}';

/// 등록일 상대 표시: 방금전 ~ 23시간전 / 1~30일전 / 한달전 ~ 일년전
String formatRegisteredAt(DateTime? date) {
  if (date == null) return '';
  final diff = DateTime.now().difference(date);
  if (diff.isNegative) return '방금전';

  final minutes = diff.inMinutes;
  if (minutes < 1) return '방금전';
  if (minutes < 60) return '${minutes}분전';

  final hours = diff.inHours;
  if (hours < 24) return '${hours}시간전';

  final days = diff.inDays;
  if (days <= 30) return '${days}일전';

  final months = days ~/ 30;
  if (months < 12) {
    return months <= 1 ? '한달전' : '${months}달전';
  }

  final years = days ~/ 365;
  return years <= 1 ? '일년전' : '${years}년전';
}

String? statusBadgeLabel(ProductStatus status) {
  switch (status) {
    case ProductStatus.reserved:
      return '예약중';
    case ProductStatus.sold:
      return '판매완료';
    default:
      return null;
  }
}

/// 상품 카드 — 사진 / 메이커·차종 / 부품명 / 금액 / 등록일
class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    this.width,
  });

  final ProductPublicDto product;
  final VoidCallback onTap;
  final double? width;

  /// 가로 스크롤 리스트용 높이 (4:3 이미지 + 본문, 텍스트 스케일 반영)
  static double horizontalListHeight(BuildContext context, double width) {
    final scaler = MediaQuery.textScalerOf(context);
    final imageH = width * 3 / 4;
    // 패딩 18 + 메이커·부품명2줄·금액·등록일·간격 (기본 14 기준)
    final bodyH = scaler.scale(14) / 14 * 124;
    return imageH + bodyH;
  }

  /// 홈 등 가로 카드 폭 — 화면 너비에 비례
  static double horizontalCardWidth(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    return (w * 0.38).clamp(132.0, 168.0);
  }

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    final image = product.thumbnailURL.isNotEmpty
        ? product.thumbnailURL
        : (product.images.isNotEmpty ? product.images.first.cardURL : '');

    final makerVehicle = [
      if (product.manufacturer.isNotEmpty) product.manufacturer,
      if (product.vehicleModelName.isNotEmpty) product.vehicleModelName,
    ].join(' ');

    final partName =
        product.partName.isNotEmpty ? product.partName : product.title;

    final registered = formatRegisteredAt(product.createdAt);
    final badge = statusBadgeLabel(product.status);

    return SizedBox(
      width: width,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: cf.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cf.divider),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 4 / 3,
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (image.isEmpty)
                        ColoredBox(
                          color: cf.surfaceVariant,
                          child: Icon(
                            CupertinoIcons.photo,
                            color: cf.textSecondary,
                          ),
                        )
                      else
                        CachedNetworkImage(
                          imageUrl: image,
                          fit: BoxFit.cover,
                          placeholder: (_, _) => ColoredBox(
                            color: cf.surfaceVariant,
                          ),
                          errorWidget: (_, _, _) => ColoredBox(
                            color: cf.surfaceVariant,
                            child: Icon(
                              CupertinoIcons.photo,
                              color: cf.textSecondary,
                            ),
                          ),
                        ),
                      if (badge != null)
                        Positioned(
                          right: 8,
                          top: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.accentBlue,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              badge,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (makerVehicle.isNotEmpty)
                      Text(
                        makerVehicle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          height: 1.25,
                          color: cf.textPrimary,
                        ),
                      ),
                    if (makerVehicle.isNotEmpty) const SizedBox(height: 2),
                    Text(
                      partName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        height: 1.25,
                        color: cf.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatWon(product.price),
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        height: 1.2,
                        color: cf.textPrimary,
                      ),
                    ),
                    if (registered.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        registered,
                        style: TextStyle(
                          fontSize: 11,
                          height: 1.2,
                          color: cf.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
