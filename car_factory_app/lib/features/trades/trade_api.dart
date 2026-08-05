import 'package:cloud_functions/cloud_functions.dart';

import '../../core/firebase/firebase_bootstrap.dart';
import '../../shared/models/trade.dart';

/// 직거래 Callable — 웹 `features/trades/trade-api.ts` 대응.
/// 주문 상태 쓰기는 절대 클라이언트에서 직접 하지 않는다.
class TradeApi {
  TradeApi({FirebaseFunctions? functions})
      : _functions = functions ?? FirebaseBootstrap.functions;

  final FirebaseFunctions _functions;

  Future<({String orderId, String orderNumber})> createDirectTrade({
    required String productId,
    required DealMethod dealMethod,
    String? buyerUid,
  }) async {
    final callable = _functions.httpsCallable('createDirectTrade');
    final result = await callable.call<Map<String, dynamic>>({
      'productId': productId,
      'dealMethod': dealMethod == DealMethod.transfer ? 'transfer' : 'meet',
      'buyerUid': ?buyerUid,
    });
    final data = Map<String, dynamic>.from(result.data as Map);
    final orderId = data['orderId'] as String?;
    final orderNumber = data['orderNumber'] as String?;
    if (orderId == null || orderNumber == null) {
      throw StateError('거래를 만들지 못했습니다.');
    }
    return (orderId: orderId, orderNumber: orderNumber);
  }

  Future<void> cancelDirectTrade({
    required String orderId,
    String? cancelReason,
  }) async {
    final callable = _functions.httpsCallable('cancelDirectTrade');
    await callable.call({
      'orderId': orderId,
      'cancelReason': ?cancelReason,
    });
  }

  Future<void> completeDirectTrade({
    required String orderId,
    required FulfillmentMethod fulfillmentMethod,
    Map<String, String>? shippingInfo,
  }) async {
    final callable = _functions.httpsCallable('completeDirectTrade');
    await callable.call({
      'orderId': orderId,
      'fulfillmentMethod':
          fulfillmentMethod == FulfillmentMethod.delivery ? 'delivery' : 'meetup',
      'shippingInfo': ?shippingInfo,
    });
  }
}
