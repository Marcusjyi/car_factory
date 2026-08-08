import {getApp, getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {logger} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-northeast3";
const DATABASE_ID = "default";
/** 판매완료 후 채팅 가능 일수 (PG·반품 전 직거래 문의용) */
const POST_SALE_CHAT_DAYS = 30;

function db() {
  return getFirestore(getApp(), DATABASE_ID);
}

function roomIdFor(productId: string, buyerUid: string) {
  return `${productId}_${buyerUid}`;
}

function chatOpenUntilFrom(date: Date): Date {
  const until = new Date(date.getTime());
  until.setDate(until.getDate() + POST_SALE_CHAT_DAYS);
  return until;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const fn = (value as {toDate?: () => Date}).toDate;
    if (typeof fn === "function") return fn.call(value);
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** users/{uid}/counters/chatUnread — 헤더 배지용 합계 */
function chatUnreadRef(uid: string) {
  return db().collection("users").doc(uid).collection("counters").doc("chatUnread");
}

async function adjustChatUnreadTotal(uid: string, delta: number) {
  if (!uid || delta === 0) return;
  await chatUnreadRef(uid).set(
    {
      total: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/** 상대방 디바이스로 채팅 푸시 발송. 실패해도 메시지 처리는 유지. */
async function sendChatPush(params: {
  peerUid: string;
  roomId: string;
  title: string;
  body: string;
}) {
  const {peerUid, roomId, title, body} = params;
  if (!peerUid) return;

  try {
    const tokensSnap = await db()
      .collection("users")
      .doc(peerUid)
      .collection("fcmTokens")
      .get();
    const tokenDocs = tokensSnap.docs.filter((d) => {
      const t = String(d.data()?.token ?? "").trim();
      return t.length > 0;
    });
    if (tokenDocs.length === 0) {
      logger.info("sendChatPush: no tokens", {peerUid, roomId});
      return;
    }

    const tokens = tokenDocs.map((d) => String(d.data().token).trim());
    const messaging = getMessaging();
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {title, body},
      data: {
        type: "chat",
        roomId,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "car_factory_chat",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    const deletes: Promise<unknown>[] = [];
    result.responses.forEach((res, i) => {
      if (res.success) return;
      const code = res.error?.code ?? "";
      logger.warn("sendChatPush failed", {
        peerUid,
        code,
        message: res.error?.message,
      });
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        deletes.push(tokenDocs[i].ref.delete());
      }
    });
    if (deletes.length > 0) {
      await Promise.all(deletes);
    }
    logger.info("sendChatPush", {
      peerUid,
      roomId,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (err) {
    logger.error("sendChatPush error", {peerUid, roomId, err});
  }
}

async function assertCompletedOrder(
  firestore: ReturnType<typeof db>,
  productId: string,
  buyerUid: string,
  sellerUid?: string,
) {
  const orderSnap = await firestore
    .collection("orders")
    .where("productId", "==", productId)
    .where("buyerUid", "==", buyerUid)
    .limit(5)
    .get();
  const hasCompleted = orderSnap.docs.some((d) => {
    const data = d.data();
    if (String(data?.status) !== "completed") return false;
    if (sellerUid && String(data?.sellerUid) !== sellerUid) return false;
    return true;
  });
  if (!hasCompleted) {
    throw new HttpsError(
      "failed-precondition",
      "판매완료된 상품은 해당 거래 당사자만 일정 기간 채팅할 수 있습니다.",
    );
  }
}

/**
 * 상품 기준 구매자–판매자 채팅방 생성 또는 재사용.
 * roomId = {productId}_{buyerUid}
 * 판매자는 buyerUid를 넘겨 상대(구매자) 채팅방을 연다.
 */
export const getOrCreateChatRoom = onCall(
  {region: REGION},
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const callerUid = request.auth.uid;
    const productId =
      typeof request.data?.productId === "string" ?
        request.data.productId.trim() :
        "";
    const requestedBuyerUid =
      typeof request.data?.buyerUid === "string" ?
        request.data.buyerUid.trim() :
        "";
    if (!productId) {
      throw new HttpsError("invalid-argument", "productId가 필요합니다.");
    }

    const firestore = db();
    const productSnap = await firestore.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
    }
    const product = productSnap.data();
    if (!product) {
      throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
    }

    const sellerUid = String(product.sellerUid ?? "");
    if (!sellerUid) {
      throw new HttpsError("failed-precondition", "판매자 정보가 없습니다.");
    }

    const isSellerCaller = callerUid === sellerUid;
    let buyerUid = "";

    if (isSellerCaller) {
      buyerUid =
        requestedBuyerUid ||
        String(product.reservedBuyerUid ?? "").trim();
      if (!buyerUid) {
        throw new HttpsError(
          "invalid-argument",
          "판매자는 구매자 정보가 필요합니다.",
        );
      }
    } else {
      buyerUid = callerUid;
      if (requestedBuyerUid && requestedBuyerUid !== callerUid) {
        throw new HttpsError(
          "permission-denied",
          "다른 구매자 채팅방을 열 수 없습니다.",
        );
      }
    }

    if (sellerUid === buyerUid) {
      throw new HttpsError(
        "permission-denied",
        "본인 상품에는 채팅할 수 없습니다.",
      );
    }

    const status = String(product.status ?? "");
    if (status === "selling") {
      if (isSellerCaller) {
        throw new HttpsError(
          "failed-precondition",
          "판매중에는 구매자가 먼저 채팅을 시작합니다.",
        );
      }
    } else if (status === "reserved") {
      const reservedBuyer = String(product.reservedBuyerUid ?? "");
      if (reservedBuyer && reservedBuyer !== buyerUid) {
        throw new HttpsError(
          "failed-precondition",
          "다른 구매자와 예약 중인 상품입니다.",
        );
      }
    } else if (status === "sold") {
      const soldAt =
        toDate(product.soldAt) || toDate(product.updatedAt) || new Date();
      const openUntil = chatOpenUntilFrom(soldAt);
      if (Date.now() > openUntil.getTime()) {
        throw new HttpsError(
          "failed-precondition",
          `판매완료 후 ${POST_SALE_CHAT_DAYS}일이 지나 채팅할 수 없습니다.`,
        );
      }

      const roomIdPreview = roomIdFor(productId, buyerUid);
      const existingRoom = await firestore
        .collection("chatRooms")
        .doc(roomIdPreview)
        .get();
      if (!existingRoom.exists) {
        await assertCompletedOrder(
          firestore,
          productId,
          buyerUid,
          sellerUid,
        );
      }
    } else {
      throw new HttpsError(
        "failed-precondition",
        "이 상품과는 채팅할 수 없습니다.",
      );
    }

    const roomId = roomIdFor(productId, buyerUid);
    const roomRef = firestore.collection("chatRooms").doc(roomId);

    let buyerDisplayName = "";
    try {
      const userSnap = await firestore.collection("users").doc(buyerUid).get();
      buyerDisplayName =
        (userSnap.data()?.displayName as string | undefined)?.trim() || "";
      if (!buyerDisplayName) {
        const pub = await firestore.collection("publicProfiles").doc(buyerUid).get();
        buyerDisplayName =
          (pub.data()?.displayName as string | undefined)?.trim() || "";
      }
    } catch {
      buyerDisplayName = "";
    }

    const soldAtForUntil =
      status === "sold" ?
        toDate(product.soldAt) || toDate(product.updatedAt) || new Date() :
        null;
    const chatOpenUntil =
      soldAtForUntil ? chatOpenUntilFrom(soldAtForUntil) : null;

    await firestore.runTransaction(async (tx) => {
      const existing = await tx.get(roomRef);
      if (existing.exists) {
        if (chatOpenUntil) {
          tx.update(roomRef, {
            chatOpenUntil,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        return;
      }

      const sellerDisplayName =
        (product.sellerDisplayName as string | undefined)?.trim() || "판매자";
      const title = (product.title as string | undefined)?.trim() || "상품";
      const thumbnailURL =
        (product.thumbnailURL as string | undefined) ||
        (product.images?.[0]?.downloadURL as string | undefined) ||
        "";
      const price = Number(product.price) || 0;

      tx.set(roomRef, {
        productId,
        buyerUid,
        sellerUid,
        participantUids: [buyerUid, sellerUid],
        productTitle: title,
        productThumbnailURL: thumbnailURL,
        productPrice: price,
        sellerDisplayName,
        buyerDisplayName: buyerDisplayName || "구매자",
        lastMessage: "",
        lastMessageAt: FieldValue.serverTimestamp(),
        unreadCountByUid: {
          [buyerUid]: 0,
          [sellerUid]: 0,
        },
        status: "active",
        ...(chatOpenUntil ? {chatOpenUntil} : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    logger.info("getOrCreateChatRoom", {
      roomId,
      productId,
      buyerUid,
      sellerUid,
      callerUid,
    });
    return {roomId};
  },
);

/**
 * 채팅방 입장 시 본인 unreadCount 를 0으로, 합계 카운터도 감소.
 */
export const markChatRoomRead = onCall(
  {region: REGION},
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    const uid = request.auth.uid;
    const roomId =
      typeof request.data?.roomId === "string" ? request.data.roomId.trim() : "";
    if (!roomId) {
      throw new HttpsError("invalid-argument", "roomId가 필요합니다.");
    }

    const firestore = db();
    const roomRef = firestore.collection("chatRooms").doc(roomId);
    const counterRef = chatUnreadRef(uid);

    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(roomRef);
      const counterSnap = await tx.get(counterRef);
      if (!snap.exists) {
        throw new HttpsError("not-found", "채팅방을 찾을 수 없습니다.");
      }
      const data = snap.data();
      if (!data) {
        throw new HttpsError("not-found", "채팅방을 찾을 수 없습니다.");
      }
      const participants = (data.participantUids as string[]) ?? [];
      if (!participants.includes(uid)) {
        throw new HttpsError("permission-denied", "참여자가 아닙니다.");
      }

      const prevUnread =
        Number((data.unreadCountByUid as Record<string, number>)?.[uid]) || 0;

      tx.update(roomRef, {
        [`unreadCountByUid.${uid}`]: 0,
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (prevUnread > 0) {
        const currentTotal = counterSnap.exists ?
          Number(counterSnap.data()?.total) || 0 :
          0;
        const nextTotal = Math.max(0, currentTotal - prevUnread);
        tx.set(
          counterRef,
          {
            total: nextTotal,
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }
    });

    return {ok: true};
  },
);

/**
 * 메시지 생성 시 lastMessage / 방 unread / 합계 카운터 갱신.
 */
export const onMessageCreated = onDocumentCreated(
  {
    document: "chatRooms/{roomId}/messages/{messageId}",
    database: DATABASE_ID,
    region: REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const snap = event.data;
    if (!snap) return;

    const message = snap.data();
    const senderUid = String(message.senderUid ?? "");
    const text =
      typeof message.text === "string" ? message.text.trim() : "";
    const isSystem = message.type === "system";
    const preview =
      message.type === "image" ? "(사진)" : text.slice(0, 200) || "(메시지)";

    const roomRef = db().collection("chatRooms").doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      logger.warn("onMessageCreated: room missing", {roomId});
      return;
    }
    const room = roomSnap.data();
    if (!room) {
      logger.warn("onMessageCreated: room empty", {roomId});
      return;
    }
    const participants = (room.participantUids as string[]) ?? [];

    if (isSystem) {
      const prevMap = (room.unreadCountByUid as Record<string, number>) ?? {};
      const unread = {...prevMap};
      for (const p of participants) {
        unread[p] = (Number(unread[p]) || 0) + 1;
      }
      await roomRef.update({
        lastMessage: preview,
        lastMessageAt: FieldValue.serverTimestamp(),
        unreadCountByUid: unread,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await Promise.all(
        participants.map((p) => adjustChatUnreadTotal(p, 1)),
      );
      logger.info("onMessageCreated system", {roomId, participants});
      return;
    }

    if (!senderUid || !participants.includes(senderUid)) {
      logger.warn("onMessageCreated: invalid sender", {roomId, senderUid});
      return;
    }

    const peerUid = participants.find((p) => p !== senderUid);
    const prevMap = (room.unreadCountByUid as Record<string, number>) ?? {};
    const prevSenderUnread = Number(prevMap[senderUid]) || 0;

    const unread = {...prevMap};
    unread[senderUid] = 0;
    if (peerUid) {
      unread[peerUid] = (Number(unread[peerUid]) || 0) + 1;
    }

    await roomRef.update({
      lastMessage: preview,
      lastMessageAt: FieldValue.serverTimestamp(),
      unreadCountByUid: unread,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 상대방 합계 +1, 발신자 방 unread를 0으로 만들 때 합계에서 차감
    const tasks: Promise<void>[] = [];
    if (peerUid) {
      tasks.push(adjustChatUnreadTotal(peerUid, 1));
    }
    if (prevSenderUnread > 0) {
      tasks.push(adjustChatUnreadTotal(senderUid, -prevSenderUnread));
    }
    await Promise.all(tasks);

    if (peerUid) {
      const senderName =
        senderUid === String(room.buyerUid) ?
          String(room.buyerDisplayName || "구매자") :
          String(room.sellerDisplayName || "판매자");
      await sendChatPush({
        peerUid,
        roomId,
        title: senderName,
        body: preview,
      });
    }

    logger.info("onMessageCreated", {roomId, senderUid, peerUid});
  },
);
