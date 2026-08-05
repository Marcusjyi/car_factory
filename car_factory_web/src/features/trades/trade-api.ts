import { httpsCallable } from "firebase/functions";
import { getClientFunctions, isFirebaseConfigured } from "@/lib/firebase/client";
import type {
  DealMethod,
  FulfillmentMethod,
  TradeShippingInfo,
} from "@/types/trade";

function stripFirebaseMessage(e: unknown): string {
  const message =
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : e instanceof Error
        ? e.message
        : "요청에 실패했습니다.";
  return message.replace(/^Firebase:\s*/i, "").replace(/\s*\(.*\)$/, "");
}

export async function createDirectTrade(input: {
  productId: string;
  dealMethod: DealMethod;
  /** 판매자가 채팅 상대(구매자)를 예약할 때 */
  buyerUid?: string;
}) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  try {
    const fn = httpsCallable<
      { productId: string; dealMethod: DealMethod; buyerUid?: string },
      { orderId: string; orderNumber: string }
    >(getClientFunctions(), "createDirectTrade");
    const result = await fn({
      productId: input.productId,
      dealMethod: input.dealMethod,
      ...(input.buyerUid ? { buyerUid: input.buyerUid } : {}),
    });
    if (!result.data?.orderId) throw new Error("거래를 만들지 못했습니다.");
    return result.data;
  } catch (e) {
    throw new Error(stripFirebaseMessage(e));
  }
}

export async function cancelDirectTrade(input: {
  orderId: string;
  cancelReason?: string;
}) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  try {
    const fn = httpsCallable<
      { orderId: string; cancelReason?: string },
      { ok: boolean }
    >(getClientFunctions(), "cancelDirectTrade");
    await fn(input);
  } catch (e) {
    throw new Error(stripFirebaseMessage(e));
  }
}

export async function completeDirectTrade(input: {
  orderId: string;
  fulfillmentMethod: FulfillmentMethod;
  shippingInfo?: TradeShippingInfo | null;
}) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  try {
    const fn = httpsCallable<
      {
        orderId: string;
        fulfillmentMethod: FulfillmentMethod;
        shippingInfo?: TradeShippingInfo | null;
      },
      { ok: boolean }
    >(getClientFunctions(), "completeDirectTrade");
    await fn({
      orderId: input.orderId,
      fulfillmentMethod: input.fulfillmentMethod,
      shippingInfo: input.shippingInfo ?? null,
    });
  } catch (e) {
    throw new Error(stripFirebaseMessage(e));
  }
}

export async function setTradeTransferInfo(input: {
  orderId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  try {
    const fn = httpsCallable<typeof input, { ok: boolean }>(
      getClientFunctions(),
      "setTradeTransferInfo",
    );
    await fn(input);
  } catch (e) {
    throw new Error(stripFirebaseMessage(e));
  }
}

export async function hideDirectTradeFromHistory(orderId: string) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  try {
    const fn = httpsCallable<{ orderId: string }, { ok: boolean }>(
      getClientFunctions(),
      "hideDirectTradeFromHistory",
    );
    await fn({ orderId });
  } catch (e) {
    throw new Error(stripFirebaseMessage(e));
  }
}
