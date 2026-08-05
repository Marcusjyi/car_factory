import { httpsCallable } from "firebase/functions";
import { getClientFunctions, isFirebaseConfigured } from "@/lib/firebase/client";

export async function getOrCreateChatRoom(
  productId: string,
  options?: { buyerUid?: string },
) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  const fn = httpsCallable<
    { productId: string; buyerUid?: string },
    { roomId: string }
  >(getClientFunctions(), "getOrCreateChatRoom");
  const result = await fn({
    productId,
    ...(options?.buyerUid ? { buyerUid: options.buyerUid } : {}),
  });
  const roomId = result.data?.roomId?.trim();
  if (!roomId) throw new Error("채팅방을 만들지 못했습니다.");
  return roomId;
}

export async function markChatRoomRead(roomId: string) {
  if (!isFirebaseConfigured()) return;
  const fn = httpsCallable<{ roomId: string }, { ok: boolean }>(
    getClientFunctions(),
    "markChatRoomRead",
  );
  await fn({ roomId });
}
