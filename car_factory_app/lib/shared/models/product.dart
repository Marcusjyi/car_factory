enum ProductStatus { draft, selling, reserved, sold, hidden, blocked }

enum ProductCondition { neu, used, refurbished }

extension ProductConditionX on ProductCondition {
  String get firestoreValue {
    switch (this) {
      case ProductCondition.neu:
        return 'new';
      case ProductCondition.used:
        return 'used';
      case ProductCondition.refurbished:
        return 'refurbished';
    }
  }

  static ProductCondition fromFirestore(String? value) {
    switch (value) {
      case 'new':
        return ProductCondition.neu;
      case 'refurbished':
        return ProductCondition.refurbished;
      default:
        return ProductCondition.used;
    }
  }
}

class ProductImage {
  const ProductImage({
    required this.path,
    required this.downloadURL,
    this.thumbURL,
    this.listURL,
    required this.width,
    required this.height,
    required this.sortOrder,
  });

  final String path;
  final String downloadURL;
  final String? thumbURL;
  final String? listURL;
  final int width;
  final int height;
  final int sortOrder;

  factory ProductImage.fromMap(Map<String, dynamic> map) {
    return ProductImage(
      path: map['path'] as String? ?? '',
      downloadURL: map['downloadURL'] as String? ?? '',
      thumbURL: map['thumbURL'] as String?,
      listURL: map['listURL'] as String?,
      width: (map['width'] as num?)?.toInt() ?? 0,
      height: (map['height'] as num?)?.toInt() ?? 0,
      sortOrder: (map['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }

  String get cardURL => listURL ?? thumbURL ?? downloadURL;
}

class ProductPublicDto {
  const ProductPublicDto({
    required this.id,
    required this.title,
    required this.price,
    required this.thumbnailURL,
    required this.images,
    required this.condition,
    required this.manufacturer,
    required this.vehicleModelName,
    required this.partName,
    required this.sellerUid,
    required this.sellerDisplayName,
    required this.status,
    this.location,
    this.listingNumber,
    this.reservedBuyerUid,
    this.activeOrderId,
  });

  final String id;
  final String title;
  final int price;
  final String thumbnailURL;
  final List<ProductImage> images;
  final ProductCondition condition;
  final String manufacturer;
  final String vehicleModelName;
  final String partName;
  final String sellerUid;
  final String sellerDisplayName;
  final ProductStatus status;
  final String? location;
  final String? listingNumber;
  final String? reservedBuyerUid;
  final String? activeOrderId;

  factory ProductPublicDto.fromMap(String id, Map<String, dynamic> map) {
    final imagesRaw = (map['images'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((e) => ProductImage.fromMap(Map<String, dynamic>.from(e)))
        .toList();
    return ProductPublicDto(
      id: id,
      title: map['title'] as String? ?? '',
      price: (map['price'] as num?)?.toInt() ?? 0,
      thumbnailURL: map['thumbnailURL'] as String? ?? '',
      images: imagesRaw,
      condition: ProductConditionX.fromFirestore(map['condition'] as String?),
      manufacturer: map['manufacturer'] as String? ?? '',
      vehicleModelName: map['vehicleModelName'] as String? ?? '',
      partName: map['partName'] as String? ?? '',
      sellerUid: map['sellerUid'] as String? ?? '',
      sellerDisplayName: map['sellerDisplayName'] as String? ?? '',
      status: _parseStatus(map['status'] as String?),
      location: map['region'] as String?,
      listingNumber: map['listingNumber'] as String?,
      reservedBuyerUid: map['reservedBuyerUid'] as String?,
      activeOrderId: map['activeOrderId'] as String?,
    );
  }

  static ProductStatus _parseStatus(String? value) {
    switch (value) {
      case 'draft':
        return ProductStatus.draft;
      case 'reserved':
        return ProductStatus.reserved;
      case 'sold':
        return ProductStatus.sold;
      case 'hidden':
        return ProductStatus.hidden;
      case 'blocked':
        return ProductStatus.blocked;
      default:
        return ProductStatus.selling;
    }
  }
}
