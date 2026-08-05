/** Firestore chatRooms / messages */

export type ChatRoomStatus = "active" | "closed" | "blocked";

export type ChatMessageType = "text" | "image" | "system";

export interface ChatRoomDocument {
  id: string;
  productId: string;
  buyerUid: string;
  sellerUid: string;
  participantUids: string[];
  productTitle: string;
  productThumbnailURL: string;
  productPrice: number;
  sellerDisplayName: string;
  buyerDisplayName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCountByUid: Record<string, number>;
  status: ChatRoomStatus;
  /** 판매완료 후 채팅 가능 시한 (ISO). 없으면 제한 없음(판매전) */
  chatOpenUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDocument {
  id: string;
  senderUid: string;
  type: ChatMessageType;
  text: string | null;
  imageURL: string | null;
  createdAt: string;
}
