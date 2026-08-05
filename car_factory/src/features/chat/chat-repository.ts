import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { ChatMessageDocument, ChatRoomDocument } from "@/types/chat";

function tsToIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

function docToRoom(id: string, data: DocumentData): ChatRoomDocument {
  return {
    id,
    productId: data.productId ?? "",
    buyerUid: data.buyerUid ?? "",
    sellerUid: data.sellerUid ?? "",
    participantUids: Array.isArray(data.participantUids)
      ? data.participantUids
      : [],
    productTitle: data.productTitle ?? "",
    productThumbnailURL: data.productThumbnailURL ?? "",
    productPrice: Number(data.productPrice) || 0,
    sellerDisplayName: data.sellerDisplayName ?? "",
    buyerDisplayName: data.buyerDisplayName ?? "",
    lastMessage: data.lastMessage ?? "",
    lastMessageAt: tsToIso(data.lastMessageAt),
    unreadCountByUid:
      data.unreadCountByUid && typeof data.unreadCountByUid === "object"
        ? (data.unreadCountByUid as Record<string, number>)
        : {},
    status: data.status === "closed" || data.status === "blocked"
      ? data.status
      : "active",
    chatOpenUntil: tsToIso(data.chatOpenUntil) || null,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function docToMessage(id: string, data: DocumentData): ChatMessageDocument {
  return {
    id,
    senderUid: data.senderUid ?? "",
    type:
      data.type === "image" || data.type === "system" ? data.type : "text",
    text: typeof data.text === "string" ? data.text : null,
    imageURL: typeof data.imageURL === "string" ? data.imageURL : null,
    createdAt: tsToIso(data.createdAt),
  };
}

export async function getChatRoom(
  roomId: string,
): Promise<ChatRoomDocument | null> {
  if (!isFirebaseConfigured() || !roomId) return null;
  const snap = await getDoc(doc(getClientDb(), "chatRooms", roomId));
  if (!snap.exists()) return null;
  return docToRoom(snap.id, snap.data());
}

/** 판매자 기준 특정 상품의 채팅방 (예약 대상 구매자 선택용) */
export async function listChatRoomsForProduct(
  sellerUid: string,
  productId: string,
): Promise<ChatRoomDocument[]> {
  if (!isFirebaseConfigured() || !sellerUid || !productId) return [];
  const q = query(
    collection(getClientDb(), "chatRooms"),
    where("participantUids", "array-contains", sellerUid),
    orderBy("lastMessageAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToRoom(d.id, d.data()))
    .filter(
      (room) =>
        room.productId === productId &&
        room.sellerUid === sellerUid &&
        room.status === "active",
    );
}

/** 내가 참여한 채팅방 실시간 목록 */
export function subscribeChatRooms(
  uid: string,
  onChange: (rooms: ChatRoomDocument[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured() || !uid) {
    onChange([]);
    return () => undefined;
  }

  const q = query(
    collection(getClientDb(), "chatRooms"),
    where("participantUids", "array-contains", uid),
    orderBy("lastMessageAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((d) => docToRoom(d.id, d.data())));
    },
    (err) => onError?.(err),
  );
}

export function subscribeChatMessages(
  roomId: string,
  onChange: (messages: ChatMessageDocument[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured() || !roomId) {
    onChange([]);
    return () => undefined;
  }

  const q = query(
    collection(getClientDb(), "chatRooms", roomId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((d) => docToMessage(d.id, d.data())));
    },
    (err) => onError?.(err),
  );
}

export async function sendTextMessage(
  roomId: string,
  senderUid: string,
  text: string,
) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error("메시지를 입력해주세요.");
  if (!roomId || !senderUid) throw new Error("채팅 정보가 올바르지 않습니다.");

  const roomSnap = await getDoc(doc(getClientDb(), "chatRooms", roomId));
  if (!roomSnap.exists()) throw new Error("채팅방을 찾을 수 없습니다.");
  const roomData = roomSnap.data();
  const roomStatus = roomData?.status;
  if (roomStatus === "closed" || roomStatus === "blocked") {
    throw new Error(
      roomStatus === "blocked"
        ? "다른 구매자와 예약되어 메시지를 보낼 수 없습니다."
        : "종료된 채팅방에는 메시지를 보낼 수 없습니다.",
    );
  }
  const openUntilIso = tsToIso(roomData?.chatOpenUntil);
  if (openUntilIso) {
    const until = new Date(openUntilIso).getTime();
    if (!Number.isNaN(until) && Date.now() > until) {
      throw new Error("판매완료 후 문의 기간이 끝나 메시지를 보낼 수 없습니다.");
    }
  }

  await addDoc(collection(getClientDb(), "chatRooms", roomId, "messages"), {
    senderUid,
    type: "text",
    text: trimmed,
    imageURL: null,
    createdAt: serverTimestamp(),
    readBy: [senderUid],
  });
}

export function isChatOpen(
  room:
    | Pick<ChatRoomDocument, "chatOpenUntil" | "status">
    | null
    | undefined,
) {
  if (!room) return false;
  if (room.status === "closed" || room.status === "blocked") return false;
  if (!room.chatOpenUntil) return true;
  const until = new Date(room.chatOpenUntil).getTime();
  if (Number.isNaN(until)) return true;
  return Date.now() <= until;
}

export function formatChatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatChatListTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

/** 목록에서 상대 표시 이름 */
export function peerDisplayName(room: ChatRoomDocument, myUid: string) {
  if (myUid === room.buyerUid) return room.sellerDisplayName || "판매자";
  return room.buyerDisplayName || "구매자";
}
