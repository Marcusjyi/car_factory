import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type {
  DealMethod,
  DirectTradeDto,
  DirectTradeStatus,
  FulfillmentMethod,
  TradeShippingInfo,
  TradeTransferInfo,
} from "@/types/trade";

function tsToIso(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const ts = value as Timestamp;
  if (typeof ts?.toDate === "function") {
    return ts.toDate().toISOString();
  }
  return "";
}

function docToTrade(id: string, data: DocumentData): DirectTradeDto {
  const transfer = data.transferInfo as TradeTransferInfo | null | undefined;
  const shipping = data.shippingInfo as TradeShippingInfo | null | undefined;
  const fulfillment = data.fulfillmentMethod as FulfillmentMethod | undefined;
  return {
    id,
    orderNumber: String(data.orderNumber ?? ""),
    buyerUid: String(data.buyerUid ?? ""),
    buyerDisplayName: String(data.buyerDisplayName ?? ""),
    sellerUid: String(data.sellerUid ?? ""),
    sellerDisplayName: String(data.sellerDisplayName ?? ""),
    productId: String(data.productId ?? ""),
    productSnapshot: {
      title: String(data.productSnapshot?.title ?? ""),
      thumbnailURL: String(data.productSnapshot?.thumbnailURL ?? ""),
      price: Number(data.productSnapshot?.price) || 0,
      partNumber: data.productSnapshot?.partNumber ?? null,
      conditionDescription: String(
        data.productSnapshot?.conditionDescription ?? "",
      ),
    },
    quantity: Number(data.quantity) || 1,
    itemAmount: Number(data.itemAmount) || 0,
    shippingFee: Number(data.shippingFee) || 0,
    totalAmount: Number(data.totalAmount) || 0,
    status: data.status as DirectTradeStatus,
    dealMethod: data.dealMethod as DealMethod,
    fulfillmentMethod:
      fulfillment === "meetup" || fulfillment === "delivery"
        ? fulfillment
        : null,
    shippingInfo:
      shipping?.carrier && shipping?.trackingNumber
        ? {
            carrier: String(shipping.carrier),
            trackingNumber: String(shipping.trackingNumber),
          }
        : null,
    transferInfo: transfer
      ? {
          bankName: String(transfer.bankName ?? ""),
          accountNumber: String(transfer.accountNumber ?? ""),
          accountHolder: String(transfer.accountHolder ?? ""),
        }
      : null,
    paymentProvider: "direct",
    reservedAt: tsToIso(data.reservedAt) || tsToIso(data.createdAt),
    completedAt: tsToIso(data.completedAt) || null,
    cancelledAt: tsToIso(data.cancelledAt) || null,
    cancelledBy: data.cancelledBy ? String(data.cancelledBy) : null,
    cancelReason: data.cancelReason ? String(data.cancelReason) : null,
    hiddenForBuyer: Boolean(data.hiddenForBuyer),
    hiddenForSeller: Boolean(data.hiddenForSeller),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function getTrade(orderId: string): Promise<DirectTradeDto | null> {
  if (!isFirebaseConfigured() || !orderId) return null;
  const snap = await getDoc(doc(getClientDb(), "orders", orderId));
  if (!snap.exists()) return null;
  return docToTrade(snap.id, snap.data());
}

export async function listMyBuyTrades(uid: string): Promise<DirectTradeDto[]> {
  if (!isFirebaseConfigured() || !uid) return [];
  const q = query(
    collection(getClientDb(), "orders"),
    where("buyerUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToTrade(d.id, d.data()))
    .filter((t) => !t.hiddenForBuyer);
}

export async function listMySellTrades(uid: string): Promise<DirectTradeDto[]> {
  if (!isFirebaseConfigured() || !uid) return [];
  const q = query(
    collection(getClientDb(), "orders"),
    where("sellerUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToTrade(d.id, d.data()))
    .filter((t) => !t.hiddenForSeller);
}

export function dealMethodLabel(method: DealMethod): string {
  return method === "meet" ? "만나서 결제" : "계좌이체";
}

export function fulfillmentMethodLabel(
  method: FulfillmentMethod | null | undefined,
): string {
  if (method === "meetup") return "직거래";
  if (method === "delivery") return "택배거래";
  return "";
}

export function tradeStatusLabel(status: DirectTradeStatus): string {
  switch (status) {
    case "reserved":
      return "예약중";
    case "completed":
      return "판매완료";
    case "cancelled":
      return "취소됨";
    default:
      return status;
  }
}
