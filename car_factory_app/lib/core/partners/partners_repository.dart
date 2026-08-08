import '../firebase/firebase_bootstrap.dart';

class PartnerShop {
  const PartnerShop({
    required this.id,
    required this.name,
    required this.address,
    required this.specialtyLabel,
    required this.badges,
    required this.photoURL,
    required this.ratingAverage,
    required this.ratingCount,
  });

  final String id;
  final String name;
  final String address;
  final String specialtyLabel;
  final List<String> badges;
  final String photoURL;
  final double ratingAverage;
  final int ratingCount;

  static PartnerShop? fromMap(String id, Map<String, dynamic> data) {
    if (data['isActive'] == false) return null;
    final specialties = (data['specialties'] as List?)
            ?.map((e) => e.toString())
            .toList() ??
        const <String>[];
    final specialtyLabel = (data['specialtyLabel'] as String?)?.trim() ?? '';
    return PartnerShop(
      id: id,
      name: (data['name'] as String?)?.trim() ?? '',
      address: (data['address'] as String?)?.trim() ?? '',
      specialtyLabel: specialtyLabel.isNotEmpty
          ? specialtyLabel
          : specialties.join(', '),
      badges: (data['badges'] as List?)?.map((e) => e.toString()).toList() ??
          const <String>[],
      photoURL: (data['photoURL'] as String?)?.trim() ??
          (data['image'] as String?)?.trim() ??
          '',
      ratingAverage: (data['ratingAverage'] as num?)?.toDouble() ?? 0,
      ratingCount: (data['ratingCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class PartnersRepository {
  PartnersRepository._();

  /// 홈 카드용: isFeatured 우선, 없으면 displayOrder 최소 활성 파트너
  static Future<PartnerShop?> fetchFeatured() async {
    try {
      final featured = await FirebaseBootstrap.db
          .collection('partners')
          .where('isFeatured', isEqualTo: true)
          .where('isActive', isEqualTo: true)
          .orderBy('displayOrder')
          .limit(1)
          .get();
      if (featured.docs.isNotEmpty) {
        final d = featured.docs.first;
        return PartnerShop.fromMap(d.id, d.data());
      }
    } catch (e) {
      FirebaseBootstrap.debugLog('partners featured query: $e');
    }

    try {
      final snap = await FirebaseBootstrap.db
          .collection('partners')
          .where('isActive', isEqualTo: true)
          .orderBy('displayOrder')
          .limit(1)
          .get();
      if (snap.docs.isEmpty) return null;
      final d = snap.docs.first;
      return PartnerShop.fromMap(d.id, d.data());
    } catch (e) {
      FirebaseBootstrap.debugLog('partners list query: $e');
      return null;
    }
  }
}
