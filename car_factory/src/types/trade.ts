/** PG 없는 직거래(만나서 결제 / 계좌이체) 주문 */

export type DealMethod = "meet" | "transfer";

/** 판매완료 시점 이행 방식 */
export type FulfillmentMethod = "meetup" | "delivery";

export type DirectTradeStatus = "reserved" | "completed" | "cancelled";

export type TradeTransferInfo = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type TradeShippingInfo = {
  carrier: string;
  trackingNumber: string;
};

export type TradeProductSnapshot = {
  title: string;
  thumbnailURL: string;
  price: number;
  partNumber: string | null;
  conditionDescription: string;
};

/** Firestore `orders/{orderId}` — 직거래 MVP (paymentProvider: direct) */
export interface DirectTradeDocument {
  id: string;
  orderNumber: string;
  buyerUid: string;
  buyerDisplayName: string;
  sellerUid: string;
  sellerDisplayName: string;
  productId: string;
  productSnapshot: TradeProductSnapshot;
  quantity: number;
  itemAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: DirectTradeStatus;
  dealMethod: DealMethod;
  /** 판매완료 시 직거래 / 택배 */
  fulfillmentMethod?: FulfillmentMethod | null;
  /** 택배거래 시 운송장 */
  shippingInfo?: TradeShippingInfo | null;
  /** 계좌이체 시 판매자가 등록 */
  transferInfo: TradeTransferInfo | null;
  /** 이후 PG 대비 — 현재는 항상 direct */
  paymentProvider: "direct";
  reservedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  /** 구매자 거래 내역에서 숨김 */
  hiddenForBuyer?: boolean;
  /** 판매자 거래 내역에서 숨김 */
  hiddenForSeller?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DirectTradeDto = DirectTradeDocument;
