import 'package:cloud_firestore/cloud_firestore.dart';

import '../firebase/firebase_bootstrap.dart';
import 'partners_repository.dart';

class PartnerReservationInput {
  const PartnerReservationInput({
    required this.shop,
    required this.customerName,
    required this.customerPhone,
    required this.preferredDate,
    required this.preferredTime,
    this.partOrOrder = '',
    this.memo = '',
  });

  final PartnerShop shop;
  final String customerName;
  final String customerPhone;
  /// YYYY-MM-DD
  final String preferredDate;
  final String preferredTime;
  final String partOrOrder;
  final String memo;
}

class PartnerReservationsRepository {
  PartnerReservationsRepository._();

  static const allowedTimes = {
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  };

  /// Returns created document id.
  static Future<String> create(PartnerReservationInput input) async {
    final name = input.customerName.trim();
    final phone = input.customerPhone.trim();
    if (name.isEmpty) {
      throw ArgumentError('이름을 입력해 주세요.');
    }
    if (phone.length < 9) {
      throw ArgumentError('연락처를 확인해 주세요.');
    }
    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(input.preferredDate)) {
      throw ArgumentError('희망 날짜를 확인해 주세요.');
    }
    if (!allowedTimes.contains(input.preferredTime)) {
      throw ArgumentError('희망 시간을 선택해 주세요.');
    }

    final uid = FirebaseBootstrap.auth.currentUser?.uid;
    final data = <String, dynamic>{
      'customerName': name.length > 80 ? name.substring(0, 80) : name,
      'customerPhone': phone.length > 20 ? phone.substring(0, 20) : phone,
      'partnerId': input.shop.id,
      'partnerName': _clip(input.shop.name, 120),
      'partnerRegion': _clip(input.shop.region, 80),
      'partnerAddress': _clip(input.shop.address, 300),
      'partnerPhone': _clip(input.shop.phone, 40),
      'preferredDate': input.preferredDate,
      'preferredTime': input.preferredTime,
      'partOrOrder': _clip(input.partOrOrder.trim(), 200),
      'memo': _clip(input.memo.trim(), 2000),
      'status': 'pending',
      'source': 'app',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
    if (uid != null) data['uid'] = uid;

    final ref = await FirebaseBootstrap.db
        .collection('partnerReservations')
        .add(data);
    return ref.id;
  }

  static String _clip(String s, int max) =>
      s.length > max ? s.substring(0, max) : s;
}
