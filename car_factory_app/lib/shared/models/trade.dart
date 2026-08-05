/// PG 없는 직거래 MVP — 웹 `types/trade.ts` 와 동일.
enum DealMethod { meet, transfer }

enum FulfillmentMethod { meetup, delivery }

enum DirectTradeStatus { reserved, completed, cancelled }

class DirectTradeDocument {
  const DirectTradeDocument({
    required this.id,
    required this.orderNumber,
    required this.buyerUid,
    required this.sellerUid,
    required this.productId,
    required this.totalAmount,
    required this.status,
    required this.dealMethod,
    required this.paymentProvider,
  });

  final String id;
  final String orderNumber;
  final String buyerUid;
  final String sellerUid;
  final String productId;
  final int totalAmount;
  final DirectTradeStatus status;
  final DealMethod dealMethod;
  final String paymentProvider;

  factory DirectTradeDocument.fromMap(String id, Map<String, dynamic> map) {
    return DirectTradeDocument(
      id: id,
      orderNumber: map['orderNumber'] as String? ?? '',
      buyerUid: map['buyerUid'] as String? ?? '',
      sellerUid: map['sellerUid'] as String? ?? '',
      productId: map['productId'] as String? ?? '',
      totalAmount: (map['totalAmount'] as num?)?.toInt() ?? 0,
      status: _parseStatus(map['status'] as String?),
      dealMethod: map['dealMethod'] == 'transfer'
          ? DealMethod.transfer
          : DealMethod.meet,
      paymentProvider: map['paymentProvider'] as String? ?? 'direct',
    );
  }

  static DirectTradeStatus _parseStatus(String? value) {
    switch (value) {
      case 'completed':
        return DirectTradeStatus.completed;
      case 'cancelled':
        return DirectTradeStatus.cancelled;
      default:
        return DirectTradeStatus.reserved;
    }
  }
}
