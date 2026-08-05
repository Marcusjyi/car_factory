import {getApp, getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-northeast3";
const DATABASE_ID = "default";
const POST_SALE_CHAT_DAYS = 30;

function db() {
  return getFirestore(getApp(), DATABASE_ID);
}

function seoulDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year.slice(-2)}${month}${day}`;
}

async function nextOrderNumber(): Promise<string> {
  const dateKey = seoulDateKey();
  const counterRef = db().collection("orderCounters").doc(dateKey);
  const seq = await db().runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists ? Number(snap.data()?.seq) || 0 : 0) + 1;
    tx.set(counterRef, {seq: next, updatedAt: FieldValue.serverTimestamp()}, {merge: true});
    return next;
  });
  return `CF-T-${dateKey}-${String(seq).padStart(5, "0")}`;
}

async function displayNameFor(uid: string): Promise<string> {
  try {
    const userSnap = await db().collection("users").doc(uid).get();
    const name = (userSnap.data()?.displayName as string | undefined)?.trim();
    if (name) return name;
    const pub = await db().collection("publicProfiles").doc(uid).get();
    return (pub.data()?.displayName as string | undefined)?.trim() || "";
  } catch {
    return "";
  }
}

function requireAuth(uid: string | undefined): string {
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  return uid;
}

async function postTradeSystemMessage(input: {
  productId: string;
  buyerUid: string;
  sellerUid: string;
  buyerDisplayName: string;
  sellerDisplayName: string;
  productTitle: string;
  productThumbnailURL: string;
  productPrice: number;
  text: string;
}) {
  const roomId = `${input.productId}_${input.buyerUid}`;
  const roomRef = db().collection("chatRooms").doc(roomId);
  const existing = await roomRef.get();
  if (!existing.exists) {
    await roomRef.set({
      productId: input.productId,
      buyerUid: input.buyerUid,
      sellerUid: input.sellerUid,
      participantUids: [input.buyerUid, input.sellerUid],
      productTitle: input.productTitle,
      productThumbnailURL: input.productThumbnailURL,
      productPrice: input.productPrice,
      sellerDisplayName: input.sellerDisplayName || "판매자",
      buyerDisplayName: input.buyerDisplayName || "구매자",
      lastMessage: "",
      lastMessageAt: FieldValue.serverTimestamp(),
      unreadCountByUid: {
        [input.buyerUid]: 0,
        [input.sellerUid]: 0,
      },
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await roomRef.collection("messages").add({
    senderUid: "system",
    type: "system",
    text: input.text,
    imageURL: null,
    createdAt: FieldValue.serverTimestamp(),
    readBy: [],
  });
}

/** 상품 관련 채팅방 조회 (판매자 기준) */
async function listSellerProductRooms(productId: string, sellerUid: string) {
  const snap = await db()
    .collection("chatRooms")
    .where("participantUids", "array-contains", sellerUid)
    .get();
  return snap.docs.filter((d) => {
    const data = d.data();
    return (
      String(data.productId ?? "") === productId &&
      String(data.sellerUid ?? "") === sellerUid
    );
  });
}

/**
 * 예약 시: 선택 구매자 채팅만 active, 나머지 blocked(+안내 메시지)
 */
async function syncChatRoomsOnReserve(input: {
  productId: string;
  sellerUid: string;
  activeBuyerUid: string;
}) {
  const rooms = await listSellerProductRooms(input.productId, input.sellerUid);
  await Promise.all(
    rooms.map(async (roomDoc) => {
      const data = roomDoc.data();
      const buyerUid = String(data.buyerUid ?? "");
      if (!buyerUid) return;
      if (buyerUid === input.activeBuyerUid) {
        await roomDoc.ref.update({
          status: "active",
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }
      await roomDoc.ref.update({
        status: "blocked",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await roomDoc.ref.collection("messages").add({
        senderUid: "system",
        type: "system",
        text:
          "다른 구매자와 예약되어 이 채팅은 일시 중지되었습니다. 예약이 취소되면 다시 대화할 수 있습니다.",
        imageURL: null,
        createdAt: FieldValue.serverTimestamp(),
        readBy: [],
      });
      await roomDoc.ref.update({
        lastMessage: "다른 구매자와 예약되어 채팅이 일시 중지되었습니다.",
        lastMessageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }),
  );
}

/** 예약 취소 시: blocked 채팅 다시 active */
async function reopenBlockedProductChatRooms(
  productId: string,
  sellerUid: string,
) {
  const rooms = await listSellerProductRooms(productId, sellerUid);
  await Promise.all(
    rooms.map(async (roomDoc) => {
      const data = roomDoc.data();
      if (data.status !== "blocked") return;
      await roomDoc.ref.update({
        status: "active",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await roomDoc.ref.collection("messages").add({
        senderUid: "system",
        type: "system",
        text: "예약이 취소되어 채팅이 다시 활성화되었습니다.",
        imageURL: null,
        createdAt: FieldValue.serverTimestamp(),
        readBy: [],
      });
      await roomDoc.ref.update({
        lastMessage: "예약이 취소되어 채팅이 다시 활성화되었습니다.",
        lastMessageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }),
  );
}

/** 예약 주문 해제 (취소·만료 공통) */
export async function releaseReservedOrder(input: {
  orderId: string;
  cancelledBy: string;
  cancelReason: string;
}) {
  const firestore = db();
  const orderRef = firestore.collection("orders").doc(input.orderId);
  const meta = await firestore.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "거래를 찾을 수 없습니다.");
    }
    const order = orderSnap.data()!;
    if (order.status !== "reserved") {
      throw new HttpsError(
        "failed-precondition",
        "예약 중인 거래만 취소할 수 있습니다.",
      );
    }

    const productRef = firestore.collection("products").doc(String(order.productId));
    const productSnap = await tx.get(productRef);

    tx.update(orderRef, {
      status: "cancelled",
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: input.cancelledBy,
      cancelReason: input.cancelReason || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (productSnap.exists) {
      const product = productSnap.data()!;
      if (
        product.status === "reserved" &&
        (product.activeOrderId === input.orderId ||
          product.reservedBuyerUid === order.buyerUid)
      ) {
        tx.update(productRef, {
          status: "selling",
          reservedBuyerUid: FieldValue.delete(),
          activeOrderId: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    const snapshot = order.productSnapshot as
      | {title?: string; thumbnailURL?: string; price?: number}
      | undefined;
    return {
      productId: String(order.productId ?? ""),
      buyerUid: String(order.buyerUid ?? ""),
      sellerUid: String(order.sellerUid ?? ""),
      buyerDisplayName: String(order.buyerDisplayName ?? ""),
      sellerDisplayName: String(order.sellerDisplayName ?? ""),
      productTitle: String(snapshot?.title ?? "상품"),
      productThumbnailURL: String(snapshot?.thumbnailURL ?? ""),
      productPrice: Number(snapshot?.price ?? order.itemAmount) || 0,
    };
  });

  if (meta.productId && meta.buyerUid && meta.sellerUid) {
    try {
      await postTradeSystemMessage({
        ...meta,
        text: input.cancelReason || "거래 예약이 취소되었습니다.",
      });
    } catch (error) {
      logger.warn("releaseReservedOrder system message failed", {
        orderId: input.orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    try {
      await reopenBlockedProductChatRooms(meta.productId, meta.sellerUid);
    } catch (error) {
      logger.warn("releaseReservedOrder reopen chats failed", {
        orderId: input.orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * 직거래 예약 (만나서 결제 / 계좌이체)
 * - 판매자: buyerUid 지정 → 채팅 합의 후 예약중 표시
 * - 구매자: 본인 예약 (하위 호환)
 * 상품 → reserved, orders 문서 생성
 */
export const createDirectTrade = onCall({region: REGION}, async (request) => {
  const callerUid = requireAuth(request.auth?.uid);
  const productId =
    typeof request.data?.productId === "string" ? request.data.productId.trim() : "";
  const requestedBuyerUid =
    typeof request.data?.buyerUid === "string" ? request.data.buyerUid.trim() : "";
  const dealMethod = request.data?.dealMethod;
  if (!productId) {
    throw new HttpsError("invalid-argument", "productId가 필요합니다.");
  }
  if (dealMethod !== "meet" && dealMethod !== "transfer") {
    throw new HttpsError(
      "invalid-argument",
      "dealMethod는 meet 또는 transfer 여야 합니다.",
    );
  }

  const firestore = db();
  const productRef = firestore.collection("products").doc(productId);
  const orderRef = firestore.collection("orders").doc();

  const productPre = await productRef.get();
  if (!productPre.exists) {
    throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
  }
  const productPreData = productPre.data()!;
  const sellerUidPre = String(productPreData.sellerUid ?? "");
  if (!sellerUidPre) {
    throw new HttpsError("failed-precondition", "판매자 정보가 없습니다.");
  }

  let buyerUid = "";
  if (callerUid === sellerUidPre) {
    if (!requestedBuyerUid) {
      throw new HttpsError(
        "invalid-argument",
        "판매자 예약에는 구매자(buyerUid)가 필요합니다.",
      );
    }
    if (requestedBuyerUid === sellerUidPre) {
      throw new HttpsError("permission-denied", "본인 상품은 구매할 수 없습니다.");
    }
    buyerUid = requestedBuyerUid;
  } else {
    buyerUid = callerUid;
    if (requestedBuyerUid && requestedBuyerUid !== callerUid) {
      throw new HttpsError(
        "permission-denied",
        "다른 구매자 명의로 예약할 수 없습니다.",
      );
    }
  }

  const orderNumber = await nextOrderNumber();
  const buyerDisplayName = await displayNameFor(buyerUid);

  let transferInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null = null;
  if (dealMethod === "transfer") {
    try {
      const sellerUser = await firestore.collection("users").doc(sellerUidPre).get();
      const acc = sellerUser.data()?.defaultTransferAccount as
        | {bankName?: string; accountNumber?: string; accountHolder?: string}
        | undefined;
      if (acc?.bankName && acc?.accountNumber && acc?.accountHolder) {
        transferInfo = {
          bankName: String(acc.bankName).trim().slice(0, 40),
          accountNumber: String(acc.accountNumber).trim().slice(0, 40),
          accountHolder: String(acc.accountHolder).trim().slice(0, 40),
        };
      }
    } catch {
      transferInfo = null;
    }
  }

  const reservedBySeller = callerUid === sellerUidPre;

  // 판매자 예약: 기존 채팅 상대만 선택 가능
  if (reservedBySeller) {
    const rooms = await listSellerProductRooms(productId, sellerUidPre);
    const hasRoom = rooms.some(
      (d) => String(d.data().buyerUid ?? "") === buyerUid,
    );
    if (!hasRoom) {
      throw new HttpsError(
        "failed-precondition",
        "채팅 중인 구매자만 예약 상대로 선택할 수 있습니다.",
      );
    }
  }

  const tradeMeta = await firestore.runTransaction(async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists) {
      throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
    }
    const product = productSnap.data()!;
    if (product.status !== "selling") {
      throw new HttpsError(
        "failed-precondition",
        "판매 중인 상품만 거래 신청할 수 있습니다.",
      );
    }
    const sellerUid = String(product.sellerUid ?? "");
    if (!sellerUid) {
      throw new HttpsError("failed-precondition", "판매자 정보가 없습니다.");
    }
    if (sellerUid === buyerUid) {
      throw new HttpsError("permission-denied", "본인 상품은 구매할 수 없습니다.");
    }

    const price = Number(product.price) || 0;
    const shippingFee =
      product.shippingFeeType === "included" ? 0 : Number(product.shippingFee) || 0;
    const thumbnailURL =
      (product.thumbnailURL as string | undefined) ||
      (product.images?.[0]?.listURL as string | undefined) ||
      (product.images?.[0]?.downloadURL as string | undefined) ||
      "";
    const title = String(product.title ?? "");
    const sellerDisplayName =
      (product.sellerDisplayName as string | undefined)?.trim() || "";

    tx.set(orderRef, {
      orderNumber,
      buyerUid,
      buyerDisplayName,
      sellerUid,
      sellerDisplayName,
      productId,
      productSnapshot: {
        title,
        thumbnailURL,
        price,
        partNumber: (product.partNumber as string | null) ?? null,
        conditionDescription:
          (product.conditionDescription as string | undefined) || "",
      },
      quantity: 1,
      itemAmount: price,
      shippingFee,
      totalAmount: price + shippingFee,
      status: "reserved",
      dealMethod,
      transferInfo,
      paymentProvider: "direct",
      reservedAt: FieldValue.serverTimestamp(),
      completedAt: null,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(productRef, {
      status: "reserved",
      reservedBuyerUid: buyerUid,
      activeOrderId: orderRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      productId,
      buyerUid,
      sellerUid,
      buyerDisplayName,
      sellerDisplayName,
      productTitle: title,
      productThumbnailURL: thumbnailURL,
      productPrice: price,
      dealMethod: String(dealMethod),
    };
  });

  const methodLabel =
    tradeMeta.dealMethod === "meet" ? "만나서 결제" : "계좌이체";
  try {
    const reserveText = reservedBySeller ?
      "판매자가 예약중으로 표시했습니다" :
      `직거래가 예약되었습니다 (${methodLabel}). 채팅으로 일정을 맞춰 주세요.`;
    await postTradeSystemMessage({
      ...tradeMeta,
      text: reserveText,
    });
  } catch (error) {
    logger.warn("createDirectTrade system message failed", {
      orderId: orderRef.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    await syncChatRoomsOnReserve({
      productId: tradeMeta.productId,
      sellerUid: tradeMeta.sellerUid,
      activeBuyerUid: tradeMeta.buyerUid,
    });
  } catch (error) {
    logger.warn("createDirectTrade sync chat rooms failed", {
      orderId: orderRef.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info("createDirectTrade", {
    orderId: orderRef.id,
    productId,
    buyerUid,
    dealMethod,
  });

  return {orderId: orderRef.id, orderNumber};
});

/**
 * 판매자: 예약 취소 → 상품 다시 selling
 * (상품 상태는 판매자만 관리)
 */
export const cancelDirectTrade = onCall({region: REGION}, async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const orderId =
    typeof request.data?.orderId === "string" ? request.data.orderId.trim() : "";
  const cancelReason =
    typeof request.data?.cancelReason === "string" ?
      request.data.cancelReason.trim().slice(0, 200) :
      "";
  if (!orderId) {
    throw new HttpsError("invalid-argument", "orderId가 필요합니다.");
  }

  const orderSnap = await db().collection("orders").doc(orderId).get();
  if (!orderSnap.exists) {
    throw new HttpsError("not-found", "거래를 찾을 수 없습니다.");
  }
  const order = orderSnap.data()!;
  if (order.sellerUid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "판매자만 예약을 취소할 수 있습니다.",
    );
  }

  await releaseReservedOrder({
    orderId,
    cancelledBy: uid,
    cancelReason: cancelReason || "판매자가 예약을 취소했습니다.",
  });

  logger.info("cancelDirectTrade", {orderId, uid});
  return {ok: true};
});

/**
 * 판매자: 계좌이체 정보 등록 (구매자 조회용)
 */
export const setTradeTransferInfo = onCall({region: REGION}, async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const orderId =
    typeof request.data?.orderId === "string" ? request.data.orderId.trim() : "";
  const bankName =
    typeof request.data?.bankName === "string" ?
      request.data.bankName.trim().slice(0, 40) :
      "";
  const accountNumber =
    typeof request.data?.accountNumber === "string" ?
      request.data.accountNumber.trim().slice(0, 40) :
      "";
  const accountHolder =
    typeof request.data?.accountHolder === "string" ?
      request.data.accountHolder.trim().slice(0, 40) :
      "";

  if (!orderId) {
    throw new HttpsError("invalid-argument", "orderId가 필요합니다.");
  }
  if (!bankName || !accountNumber || !accountHolder) {
    throw new HttpsError(
      "invalid-argument",
      "은행명, 계좌번호, 예금주를 모두 입력해주세요.",
    );
  }

  const orderRef = db().collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new HttpsError("not-found", "거래를 찾을 수 없습니다.");
  }
  const order = orderSnap.data()!;
  if (order.sellerUid !== uid) {
    throw new HttpsError("permission-denied", "판매자만 계좌를 등록할 수 있습니다.");
  }
  if (order.status !== "reserved") {
    throw new HttpsError(
      "failed-precondition",
      "예약 중인 거래에만 계좌를 등록할 수 있습니다.",
    );
  }
  if (order.dealMethod !== "transfer") {
    throw new HttpsError(
      "failed-precondition",
      "계좌이체 거래에만 계좌를 등록할 수 있습니다.",
    );
  }

  await orderRef.update({
    transferInfo: {bankName, accountNumber, accountHolder},
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {ok: true};
});

/**
 * 판매자: 거래 완료(판매완료) — 상품 sold
 * - fulfillmentMethod: meetup(직거래) | delivery(택배)
 * - delivery면 shippingInfo(택배사·운송장) 필수
 */
export const completeDirectTrade = onCall({region: REGION}, async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const orderId =
    typeof request.data?.orderId === "string" ? request.data.orderId.trim() : "";
  const fulfillmentMethod = request.data?.fulfillmentMethod;
  const shippingRaw = request.data?.shippingInfo as
    | {carrier?: string; trackingNumber?: string}
    | null
    | undefined;

  if (!orderId) {
    throw new HttpsError("invalid-argument", "orderId가 필요합니다.");
  }
  if (fulfillmentMethod !== "meetup" && fulfillmentMethod !== "delivery") {
    throw new HttpsError(
      "invalid-argument",
      "직거래 또는 택배거래를 선택해주세요.",
    );
  }

  let shippingInfo: {carrier: string; trackingNumber: string} | null = null;
  if (fulfillmentMethod === "delivery") {
    const carrier =
      typeof shippingRaw?.carrier === "string" ?
        shippingRaw.carrier.trim().slice(0, 40) :
        "";
    const trackingNumber =
      typeof shippingRaw?.trackingNumber === "string" ?
        shippingRaw.trackingNumber.trim().slice(0, 60) :
        "";
    if (!carrier || trackingNumber.length < 4) {
      throw new HttpsError(
        "invalid-argument",
        "택배사와 운송장 번호를 입력해주세요.",
      );
    }
    shippingInfo = {carrier, trackingNumber};
  }

  const firestore = db();
  const orderRef = firestore.collection("orders").doc(orderId);

  const notify = await firestore.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "거래를 찾을 수 없습니다.");
    }
    const order = orderSnap.data()!;
    if (order.sellerUid !== uid) {
      throw new HttpsError(
        "permission-denied",
        "판매자만 판매완료 처리할 수 있습니다.",
      );
    }
    if (order.status !== "reserved") {
      throw new HttpsError(
        "failed-precondition",
        "예약 중인 거래만 완료할 수 있습니다.",
      );
    }

    const productRef = firestore.collection("products").doc(String(order.productId));
    const productSnap = await tx.get(productRef);

    const buyerUid = String(order.buyerUid ?? "");
    const productId = String(order.productId ?? "");
    const roomRef =
      buyerUid && productId ?
        firestore.collection("chatRooms").doc(`${productId}_${buyerUid}`) :
        null;
    const roomSnap = roomRef ? await tx.get(roomRef) : null;
    const snapshot = order.productSnapshot as
      | {title?: string; thumbnailURL?: string; price?: number}
      | undefined;

    tx.update(orderRef, {
      status: "completed",
      fulfillmentMethod,
      shippingInfo,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (productSnap.exists) {
      tx.update(productRef, {
        status: "sold",
        soldAt: FieldValue.serverTimestamp(),
        reservedBuyerUid: FieldValue.delete(),
        activeOrderId: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (roomRef) {
      const until = new Date();
      until.setDate(until.getDate() + POST_SALE_CHAT_DAYS);
      if (roomSnap?.exists) {
        tx.update(roomRef, {
          chatOpenUntil: until,
          status: "active",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(roomRef, {
          productId,
          buyerUid,
          sellerUid: uid,
          participantUids: [buyerUid, uid],
          productTitle: String(snapshot?.title ?? "상품"),
          productThumbnailURL: String(snapshot?.thumbnailURL ?? ""),
          productPrice: Number(order.totalAmount) || 0,
          sellerDisplayName: String(order.sellerDisplayName ?? "판매자"),
          buyerDisplayName: String(order.buyerDisplayName ?? "구매자"),
          lastMessage: "",
          lastMessageAt: FieldValue.serverTimestamp(),
          unreadCountByUid: {
            [buyerUid]: 0,
            [uid]: 0,
          },
          status: "active",
          chatOpenUntil: until,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return {
      productId,
      buyerUid,
      sellerUid: uid,
      buyerDisplayName: String(order.buyerDisplayName ?? ""),
      sellerDisplayName: String(order.sellerDisplayName ?? ""),
      productTitle: String(snapshot?.title ?? "상품"),
      productThumbnailURL: String(snapshot?.thumbnailURL ?? ""),
      productPrice: Number(snapshot?.price ?? order.itemAmount) || 0,
      fulfillmentMethod: String(fulfillmentMethod),
      shippingInfo,
    };
  });

  if (notify.productId && notify.buyerUid) {
    try {
      const completeText =
        notify.fulfillmentMethod === "delivery" && notify.shippingInfo ?
          [
            "판매가 완료되었습니다",
            `(${notify.shippingInfo.carrier} ${notify.shippingInfo.trackingNumber}).`,
            `${POST_SALE_CHAT_DAYS}일간 채팅으로 연락할 수 있습니다.`,
          ].join(" ") :
          [
            "판매가 완료되었습니다 (직거래).",
            `${POST_SALE_CHAT_DAYS}일간 채팅으로 연락할 수 있습니다.`,
          ].join(" ");
      await postTradeSystemMessage({
        ...notify,
        text: completeText,
      });
    } catch (error) {
      logger.warn("completeDirectTrade system message failed", {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    try {
      const rooms = await listSellerProductRooms(
        notify.productId,
        notify.sellerUid,
      );
      await Promise.all(
        rooms.map(async (roomDoc) => {
          const data = roomDoc.data();
          const buyerUid = String(data.buyerUid ?? "");
          if (buyerUid === notify.buyerUid) return;
          if (data.status === "blocked" || data.status === "active") {
            await roomDoc.ref.update({
              status: "closed",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }),
      );
    } catch (error) {
      logger.warn("completeDirectTrade close other chats failed", {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info("completeDirectTrade", {
    orderId,
    uid,
    fulfillmentMethod,
  });
  return {ok: true};
});

/**
 * 내 거래 내역에서 숨기기 (취소·완료만)
 * - 구매자: hiddenForBuyer
 * - 판매자: hiddenForSeller
 */
export const hideDirectTradeFromHistory = onCall({region: REGION}, async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const orderId =
    typeof request.data?.orderId === "string" ? request.data.orderId.trim() : "";
  if (!orderId) {
    throw new HttpsError("invalid-argument", "orderId가 필요합니다.");
  }

  const orderRef = db().collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new HttpsError("not-found", "거래를 찾을 수 없습니다.");
  }
  const order = orderSnap.data()!;
  const isBuyer = order.buyerUid === uid;
  const isSeller = order.sellerUid === uid;
  if (!isBuyer && !isSeller) {
    throw new HttpsError("permission-denied", "본인 거래만 삭제할 수 있습니다.");
  }
  if (order.status !== "cancelled" && order.status !== "completed") {
    throw new HttpsError(
      "failed-precondition",
      "취소되었거나 판매완료된 거래만 내역에서 삭제할 수 있습니다.",
    );
  }

  const patch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (isBuyer) patch.hiddenForBuyer = true;
  if (isSeller) patch.hiddenForSeller = true;

  await orderRef.update(patch);
  logger.info("hideDirectTradeFromHistory", {orderId, uid, isBuyer, isSeller});
  return {ok: true};
});
