import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/firebase/firebase_bootstrap.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/cf_header.dart';
import '../../auth/auth_controller.dart';

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final cf = context.cf;
    final uid = auth.firebaseUser?.uid;

    return Scaffold(
      backgroundColor: cf.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 8, 0),
              child: Row(
                children: [
                  const CfPageTitle('채팅'),
                  const Spacer(),
                  IconButton(
                    onPressed: () {},
                    icon: Icon(CupertinoIcons.search, color: cf.textPrimary),
                  ),
                ],
              ),
            ),
            Expanded(
              child: uid == null
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '채팅은 로그인 후 이용할 수 있습니다.',
                            style: TextStyle(color: cf.textSecondary),
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: () =>
                                context.push('/login?next=/chat'),
                            child: const Text('로그인'),
                          ),
                        ],
                      ),
                    )
                  : StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream: FirebaseBootstrap.db
                          .collection('chatRooms')
                          .where('participantUids', arrayContains: uid)
                          .orderBy('updatedAt', descending: true)
                          .limit(50)
                          .snapshots(),
                      builder: (context, snap) {
                        if (snap.hasError) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(
                                '채팅 목록을 불러오지 못했습니다.\n'
                                '인덱스가 필요할 수 있습니다.\n${snap.error}',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: cf.textSecondary),
                              ),
                            ),
                          );
                        }
                        if (!snap.hasData) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }
                        final docs = snap.data!.docs;
                        if (docs.isEmpty) {
                          return Center(
                            child: Text(
                              '채팅방이 없습니다.\n상품 상세에서 채팅을 시작해 보세요.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: cf.textSecondary,
                                height: 1.5,
                              ),
                            ),
                          );
                        }
                        return ListView.separated(
                          itemCount: docs.length,
                          separatorBuilder: (_, _) =>
                              Divider(height: 1, color: cf.divider),
                          itemBuilder: (context, i) {
                            final data = docs[i].data();
                            final roomId = docs[i].id;
                            final title = data['productTitle'] as String? ??
                                data['title'] as String? ??
                                '채팅';
                            final last = data['lastMessage'] as String? ??
                                data['lastMessageText'] as String? ??
                                '';
                            final updatedAt = data['updatedAt'];
                            String time = '';
                            if (updatedAt is Timestamp) {
                              time = DateFormat('M/d HH:mm')
                                  .format(updatedAt.toDate());
                            }
                            final unreadMap =
                                data['unreadCounts'] as Map<String, dynamic>?;
                            final unread =
                                (unreadMap?[uid] as num?)?.toInt() ?? 0;

                            return ListTile(
                              onTap: () => context.push('/chat/$roomId'),
                              leading: CircleAvatar(
                                backgroundColor: cf.surfaceVariant,
                                child: Icon(
                                  CupertinoIcons.chat_bubble_2,
                                  color: cf.textSecondary,
                                ),
                              ),
                              title: Text(
                                title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: cf.textPrimary,
                                ),
                              ),
                              subtitle: Text(
                                last.isEmpty ? '메시지가 없습니다' : last,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: cf.textSecondary),
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    time,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: cf.textSecondary,
                                    ),
                                  ),
                                  if (unread > 0) ...[
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentBlue,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        '$unread',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
