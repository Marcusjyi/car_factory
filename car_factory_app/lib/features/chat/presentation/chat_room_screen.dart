import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/firebase/firebase_bootstrap.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cf_header.dart';
import '../../../shared/widgets/product_card.dart';
import '../../auth/auth_controller.dart';
import '../chat_api.dart';

class ChatRoomScreen extends ConsumerStatefulWidget {
  const ChatRoomScreen({super.key, required this.roomId});

  final String roomId;

  @override
  ConsumerState<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends ConsumerState<ChatRoomScreen> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ChatApi().markChatRoomRead(roomId: widget.roomId).catchError((_) {});
    });
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    final uid = ref.read(authControllerProvider).firebaseUser?.uid;
    if (uid == null) return;

    setState(() => _sending = true);
    try {
      // chatRooms 메타는 Rules상 클라이언트 write 금지 — lastMessage 등은 onMessageCreated가 갱신
      await FirebaseBootstrap.db
          .collection('chatRooms')
          .doc(widget.roomId)
          .collection('messages')
          .add({
        'senderUid': uid,
        'type': 'text',
        'text': text,
        'imageURL': null,
        'createdAt': FieldValue.serverTimestamp(),
        'readBy': [uid],
      });
      _inputCtrl.clear();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('전송 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    final uid = ref.watch(authControllerProvider).firebaseUser?.uid;

    return Scaffold(
      backgroundColor: cf.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: Icon(CupertinoIcons.back, color: cf.textPrimary),
                  ),
                  const CfPageTitle('채팅'),
                  const Spacer(),
                  IconButton(
                    onPressed: () {},
                    icon: Icon(CupertinoIcons.search, color: cf.textPrimary),
                  ),
                ],
              ),
            ),
            StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
              stream: FirebaseBootstrap.db
                  .collection('chatRooms')
                  .doc(widget.roomId)
                  .snapshots(),
              builder: (context, roomSnap) {
                final data = roomSnap.data?.data() ?? {};
                final productId = data['productId'] as String?;
                final title = data['productTitle'] as String? ?? '상품';
                final price = (data['productPrice'] as num?)?.toInt() ?? 0;
                final thumb = data['productThumbnailURL'] as String? ?? '';
                final seller =
                    data['sellerDisplayName'] as String? ?? '판매자';
                final status = data['productStatus'] as String? ?? 'selling';

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      child: InkWell(
                        onTap: productId == null
                            ? null
                            : () => context.push('/parts/$productId'),
                        borderRadius: BorderRadius.circular(12),
                        child: Ink(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: cf.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: cf.divider),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: SizedBox(
                                  width: 64,
                                  height: 64,
                                  child: thumb.isEmpty
                                      ? ColoredBox(
                                          color: cf.surfaceVariant,
                                          child: Icon(
                                            CupertinoIcons.photo,
                                            color: cf.textSecondary,
                                          ),
                                        )
                                      : Image.network(thumb, fit: BoxFit.cover),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentBlue,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        status == 'selling' ? '판매중' : status,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: cf.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      price > 0 ? formatWon(price) : '',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        color: cf.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      seller,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: cf.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                CupertinoIcons.chevron_right,
                                color: cf.textSecondary,
                                size: 16,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
            Expanded(
              child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseBootstrap.db
                    .collection('chatRooms')
                    .doc(widget.roomId)
                    .collection('messages')
                    .orderBy('createdAt', descending: false)
                    .limit(200)
                    .snapshots(),
                builder: (context, snap) {
                  if (!snap.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final docs = snap.data!.docs;
                  if (docs.isEmpty) {
                    return Center(
                      child: Text(
                        '메시지를 보내 대화를 시작하세요.',
                        style: TextStyle(color: cf.textSecondary),
                      ),
                    );
                  }
                  return ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    itemCount: docs.length,
                    itemBuilder: (context, i) {
                      final data = docs[i].data();
                      final sender = data['senderUid'] as String? ?? '';
                      final mine = sender == uid;
                      final text = data['text'] as String? ?? '';
                      final createdAt = data['createdAt'];
                      String time = '';
                      if (createdAt is Timestamp) {
                        time = DateFormat('HH:mm').format(createdAt.toDate());
                      }

                      // date separator
                      Widget? dateHeader;
                      if (createdAt is Timestamp) {
                        final d = createdAt.toDate();
                        final show = i == 0 || () {
                          final prev = docs[i - 1].data()['createdAt'];
                          if (prev is! Timestamp) return true;
                          final pd = prev.toDate();
                          return d.year != pd.year ||
                              d.month != pd.month ||
                              d.day != pd.day;
                        }();
                        if (show) {
                          dateHeader = Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Center(
                              child: Text(
                                DateFormat('M월 d일').format(d),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cf.textSecondary,
                                ),
                              ),
                            ),
                          );
                        }
                      }

                      return Column(
                        children: [
                          ?dateHeader,
                          Align(
                            alignment: mine
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                maxWidth:
                                    MediaQuery.of(context).size.width * 0.72,
                              ),
                              child: Column(
                                crossAxisAlignment: mine
                                    ? CrossAxisAlignment.end
                                    : CrossAxisAlignment.start,
                                children: [
                                  if (!mine)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 4),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          CircleAvatar(
                                            radius: 12,
                                            backgroundColor: AppColors.accentBlue,
                                            child: const Text(
                                              'CF',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 8,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            '판매자',
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: cf.textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 10,
                                    ),
                                    decoration: BoxDecoration(
                                      color: mine
                                          ? AppColors.chatBubbleMine
                                          : cf.chatBubbleTheirs,
                                      borderRadius: BorderRadius.only(
                                        topLeft: const Radius.circular(16),
                                        topRight: const Radius.circular(16),
                                        bottomLeft: Radius.circular(
                                          mine ? 16 : 4,
                                        ),
                                        bottomRight: Radius.circular(
                                          mine ? 4 : 16,
                                        ),
                                      ),
                                    ),
                                    child: Text(
                                      text,
                                      style: TextStyle(
                                        color: mine
                                            ? Colors.white
                                            : cf.textPrimary,
                                        height: 1.35,
                                      ),
                                    ),
                                  ),
                                  if (time.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        time,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: cf.textSecondary,
                                        ),
                                      ),
                                    ),
                                  const SizedBox(height: 10),
                                ],
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Container(
                height: 60,
                decoration: BoxDecoration(
                  color: cf.surfaceVariant,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(width: 18),
                    Expanded(
                      child: TextField(
                        controller: _inputCtrl,
                        textAlignVertical: TextAlignVertical.center,
                        style: TextStyle(
                          color: cf.textPrimary,
                          fontSize: 15,
                        ),
                        cursorColor: AppColors.accentBlue,
                        decoration: InputDecoration(
                          hintText: '대화를 입력해주세요',
                          hintStyle: TextStyle(
                            color: cf.textSecondary,
                            fontSize: 15,
                          ),
                          isCollapsed: true,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    GestureDetector(
                      onTap: _sending ? null : _send,
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Icon(
                          Icons.send_rounded,
                          color: cf.textSecondary,
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
