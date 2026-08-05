import 'package:cloud_firestore/cloud_firestore.dart';

import '../../core/firebase/firebase_bootstrap.dart';
import '../../shared/models/product.dart';

class ProductSearchFilter {
  const ProductSearchFilter({
    this.q,
    this.manufacturer,
    this.statuses = const [ProductStatus.selling, ProductStatus.reserved],
    this.limit = 20,
  });

  final String? q;
  final String? manufacturer;
  final List<ProductStatus> statuses;
  final int limit;
}

/// 공개 상품 조회 — 웹 ProductRepository 와 동일 컬렉션.
class ProductRepository {
  ProductRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseBootstrap.db;

  final FirebaseFirestore _db;

  CollectionReference<Map<String, dynamic>> get _products =>
      _db.collection('products');

  Future<ProductPublicDto?> getPublicProduct(String productId) async {
    final snap = await _products.doc(productId).get();
    if (!snap.exists || snap.data() == null) return null;
    final data = snap.data()!;
    final status = data['status'] as String?;
    if (status == 'blocked' || status == 'draft' || status == 'hidden') {
      return null;
    }
    return ProductPublicDto.fromMap(snap.id, data);
  }

  Future<List<ProductPublicDto>> listProducts([
    ProductSearchFilter filter = const ProductSearchFilter(),
  ]) async {
    Query<Map<String, dynamic>> query = _products;

    if (filter.statuses.length == 1) {
      query = query.where(
        'status',
        isEqualTo: filter.statuses.first.name,
      );
    } else if (filter.statuses.isNotEmpty) {
      query = query.where(
        'status',
        whereIn: filter.statuses.map((e) => e.name).toList(),
      );
    }

    if (filter.manufacturer != null && filter.manufacturer!.isNotEmpty) {
      query = query.where('manufacturer', isEqualTo: filter.manufacturer);
    }

    query = query.orderBy('createdAt', descending: true).limit(filter.limit);

    final snap = await query.get();
    var items = snap.docs
        .map((d) => ProductPublicDto.fromMap(d.id, d.data()))
        .toList();

    final q = filter.q?.trim().toLowerCase();
    if (q != null && q.isNotEmpty) {
      items = items
          .where(
            (p) =>
                p.title.toLowerCase().contains(q) ||
                p.partName.toLowerCase().contains(q) ||
                p.vehicleModelName.toLowerCase().contains(q) ||
                p.manufacturer.toLowerCase().contains(q),
          )
          .toList();
    }
    return items;
  }
}
