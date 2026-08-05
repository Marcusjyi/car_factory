"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  CompleteSaleModal,
  type CompleteSalePayload,
} from "@/components/trade/CompleteSaleModal";
import {
  cancelDirectTrade,
  completeDirectTrade,
  createDirectTrade,
} from "@/features/trades/trade-api";
import { getProductRepository } from "@/features/products/product-repository";
import type { ChatRoomDocument } from "@/types/chat";
import type { ProductPublicDto, ProductStatus } from "@/types/product";
import { cn } from "@/lib/utils";

type ManageableStatus = "selling" | "reserved" | "sold";

/** 상품보기와 동일한 칩 높이·라디우스 */
const chipBase =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-semibold";

type ChatProductStatusSelectProps = {
  room: ChatRoomDocument;
  uid: string;
  className?: string;
  onError?: (message: string) => void;
};

/**
 * 채팅 헤더용 판매 상태 컨트롤
 * - 판매자: 드롭다운으로 예약/완료/취소
 * - 구매자: 예약중·판매완료 배지만
 */
export function ChatProductStatusSelect({
  room,
  uid,
  className,
  onError,
}: ChatProductStatusSelectProps) {
  const selectId = useId();
  const isSeller = uid === room.sellerUid;
  const [product, setProduct] = useState<ProductPublicDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const load = useCallback(async () => {
    const next = await getProductRepository().getPublicProduct(room.productId);
    // getPublicProduct may not include activeOrderId — prefer owned if seller
    if (isSeller && uid) {
      try {
        const owned = await getProductRepository().getOwnedProduct(
          room.productId,
          uid,
        );
        setProduct(owned);
        return;
      } catch {
        // fall through
      }
    }
    setProduct(next);
  }, [isSeller, room.productId, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const current: ManageableStatus =
    product?.status === "reserved" || product?.status === "sold"
      ? product.status
      : "selling";

  if (!isSeller) {
    return <BuyerStatusBadge status={product?.status} className={className} />;
  }

  if (!product) {
    return (
      <span
        className={cn(
          chipBase,
          "min-w-[88px] border border-[#d2d2d7] bg-white",
          className,
        )}
      >
        <Loader2 className="size-3.5 animate-spin text-[#86868b]" />
      </span>
    );
  }

  async function applyStatus(next: ManageableStatus) {
    if (!product || next === current || busy) return;
    onError?.("");

    if (next === "reserved") {
      const ok = window.confirm(
        `${room.buyerDisplayName || "이 구매자"}와 예약중으로 표시할까요?`,
      );
      if (!ok) return;
      setBusy(true);
      try {
        const { orderId } = await createDirectTrade({
          productId: product.id,
          dealMethod: "meet",
          buyerUid: room.buyerUid,
        });
        setProduct({
          ...product,
          status: "reserved",
          activeOrderId: orderId,
          reservedBuyerUid: room.buyerUid,
        });
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "예약에 실패했습니다.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (next === "sold") {
      if (product.status === "reserved") {
        if (
          product.reservedBuyerUid &&
          product.reservedBuyerUid !== room.buyerUid
        ) {
          onError?.(
            "다른 구매자와 예약 중입니다. 해당 채팅에서 판매완료 해주세요.",
          );
          return;
        }
        if (!product.activeOrderId) {
          onError?.("예약 주문 정보가 없어 판매완료할 수 없습니다.");
          return;
        }
        setCompleteOpen(true);
        return;
      }
      onError?.(
        "판매완료하려면 먼저 이 구매자와 예약중으로 표시해 주세요.",
      );
      return;
    }

    if (product.status === "reserved") {
      if (!product.activeOrderId) {
        onError?.("예약 주문 정보가 없어 취소할 수 없습니다.");
        return;
      }
      const ok = window.confirm("예약을 취소하고 다시 판매중으로 표시할까요?");
      if (!ok) return;
      setBusy(true);
      try {
        await cancelDirectTrade({ orderId: product.activeOrderId });
        setProduct({
          ...product,
          status: "selling",
          activeOrderId: null,
          reservedBuyerUid: null,
        });
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "예약 취소에 실패했습니다.");
      } finally {
        setBusy(false);
      }
    }
  }

  async function onCompleteSale(payload: CompleteSalePayload) {
    if (!product?.activeOrderId) return;
    setBusy(true);
    try {
      await completeDirectTrade({
        orderId: product.activeOrderId,
        fulfillmentMethod: payload.fulfillmentMethod,
        shippingInfo: payload.shippingInfo,
      });
      setCompleteOpen(false);
      setProduct({
        ...product,
        status: "sold",
        activeOrderId: null,
        reservedBuyerUid: null,
      });
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : "판매완료 처리에 실패했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <label className={cn("relative inline-flex", className)}>
        <span className="sr-only">상품 상태</span>
        <select
          id={selectId}
          value={current}
          disabled={busy || current === "sold"}
          onChange={(e) => void applyStatus(e.target.value as ManageableStatus)}
          className={cn(
            chipBase,
            "min-w-[96px] appearance-none border border-[#d2d2d7] bg-white py-0 pl-3 pr-8 text-[#1d1d1f] outline-none focus:border-[#0071e3] disabled:opacity-60",
          )}
        >
          <option value="selling">판매중</option>
          <option value="reserved">예약중</option>
          <option value="sold">판매완료</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#86868b]">
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : current === "sold" ? null : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </label>

      {completeOpen ? (
        <CompleteSaleModal
          title={product.partName || product.title || room.productTitle}
          busy={busy}
          onClose={() => {
            if (busy) return;
            setCompleteOpen(false);
          }}
          onConfirm={(payload) => void onCompleteSale(payload)}
        />
      ) : null}
    </>
  );
}

function BuyerStatusBadge({
  status,
  className,
}: {
  status: ProductStatus | null | undefined;
  className?: string;
}) {
  if (status === "reserved" || status === "sold") {
    return (
      <span
        className={cn(
          chipBase,
          "bg-[#016ff9] text-white",
          className,
        )}
      >
        {status === "reserved" ? "예약중" : "판매완료"}
      </span>
    );
  }
  return null;
}
