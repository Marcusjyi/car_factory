import 'package:cloud_functions/cloud_functions.dart';

import '../../core/firebase/firebase_bootstrap.dart';

/// 채팅방 — 웹 `getOrCreateChatRoom` Callable 대응.
class ChatApi {
  ChatApi({FirebaseFunctions? functions})
      : _functions = functions ?? FirebaseBootstrap.functions;

  final FirebaseFunctions _functions;

  Future<String> getOrCreateChatRoom({required String productId}) async {
    final callable = _functions.httpsCallable('getOrCreateChatRoom');
    final result = await callable.call<Map<String, dynamic>>({
      'productId': productId,
    });
    final data = Map<String, dynamic>.from(result.data as Map);
    final roomId = data['roomId'] as String?;
    if (roomId == null || roomId.isEmpty) {
      throw StateError('채팅방을 만들지 못했습니다.');
    }
    return roomId;
  }

  Future<void> markChatRoomRead({required String roomId}) async {
    final callable = _functions.httpsCallable('markChatRoomRead');
    await callable.call({'roomId': roomId});
  }
}
