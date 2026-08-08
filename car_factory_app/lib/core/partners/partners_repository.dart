import 'package:cloud_firestore/cloud_firestore.dart';

import '../firebase/firebase_bootstrap.dart';

class PartnerShop {
  const PartnerShop({
    required this.id,
    required this.name,
    required this.region,
    required this.address,
    required this.phone,
    required this.hours,
    required this.description,
    required this.specialties,
    required this.specialtyLabel,
    required this.badges,
    required this.photoURL,
    required this.ratingAverage,
    required this.ratingCount,
  });

  final String id;
  final String name;
  final String region;
  final String address;
  final String phone;
  final String hours;
  final String description;
  final List<String> specialties;
  final String specialtyLabel;
  final List<String> badges;
  final String photoURL;
  final double ratingAverage;
  final int ratingCount;

  static PartnerShop? fromData(String id, Map<String, dynamic> data) {
    if (data['isActive'] == false) return null;
    final name = (data['name'] as String?)?.trim() ?? '';
    if (name.isEmpty) return null;

    final specialties = (data['specialties'] as List?)
            ?.map((e) => e.toString())
            .toList() ??
        const <String>[];
    final specialtyLabel = (data['specialtyLabel'] as String?)?.trim() ?? '';

    return PartnerShop(
      id: id,
      name: name,
      region: (data['region'] as String?)?.trim() ?? '',
      address: (data['address'] as String?)?.trim() ?? '',
      phone: (data['phone'] as String?)?.trim() ?? '',
      hours: (data['hours'] as String?)?.trim() ?? '',
      description: (data['description'] as String?)?.trim() ?? '',
      specialties: specialties,
      specialtyLabel:
          specialtyLabel.isNotEmpty ? specialtyLabel : specialties.join(', '),
      badges: (data['badges'] as List?)?.map((e) => e.toString()).toList() ??
          const <String>[],
      photoURL: (data['photoURL'] as String?)?.trim() ??
          (data['image'] as String?)?.trim() ??
          '',
      ratingAverage: (data['ratingAverage'] as num?)?.toDouble() ?? 0,
      ratingCount: (data['ratingCount'] as num?)?.toInt() ?? 0,
    );
  }

  static PartnerShop? fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    return fromData(doc.id, doc.data());
  }
}

class PartnersRepository {
  PartnersRepository._();

  /// Firestore `partners`에서 활성 1건. 없으면 null.
  static Future<PartnerShop?> fetchFeatured() async {
    try {
      final snap = await FirebaseBootstrap.db
          .collection('partners')
          .where('isActive', isEqualTo: true)
          .limit(20)
          .get(const GetOptions(source: Source.server));

      final shops = snap.docs
          .map(PartnerShop.fromDoc)
          .whereType<PartnerShop>()
          .toList()
        ..sort((a, b) => a.name.compareTo(b.name));

      final first = shops.isEmpty ? null : shops.first;
      FirebaseBootstrap.debugLog(
        first == null
            ? 'partners: empty'
            : 'partners: ${first.id} ${first.name}',
      );
      return first;
    } catch (e) {
      FirebaseBootstrap.debugLog('partners: $e');
      return null;
    }
  }

  static Future<PartnerShop?> fetchById(String id) async {
    try {
      final snap = await FirebaseBootstrap.db
          .collection('partners')
          .doc(id)
          .get(const GetOptions(source: Source.server));
      if (!snap.exists || snap.data() == null) return null;
      return PartnerShop.fromData(snap.id, snap.data()!);
    } catch (e) {
      FirebaseBootstrap.debugLog('partners/$id: $e');
      return null;
    }
  }
}
