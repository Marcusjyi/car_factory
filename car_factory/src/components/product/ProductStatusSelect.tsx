"use client";

import { useId, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { TradeMethodModal } from "@/components/trade/TradeMethodModal";
import {
  CompleteSaleModal,
  type CompleteSalePayload,
} from "@/components/trade/CompleteSaleModal";
import { listChatRoomsForProduct } from "@/features/chat/chat-repository";
import {
  cancelDirectTrade,
  completeDirectTrade,
  createDirectTrade,
} from "@/features/trades/trade-api";
import { getProductRepository } from "@/features/products/product-repository";
import type { ProductPublicDto, ProductStatus } from "@/types/product";
import { cn } from "@/lib/utils";

type ManageableStatus = "selling" | "reserved" | "sold";

type ProductStatusSelectProps = {
  product: ProductPublicDto;
  sellerUid: string;
  busy?: boolean;
  className?: string;
  onChanged?: (next: ProductPublicDto) => void;
  onError?: (message: string) => void;
};

const selectBase =
  "h-10 w-full appearance-none rounded-lg border bg-white py-0 pl-3 pr-9 text-sm font-semibold outline-none focus:border-primary disabled:opacity-60";

export function ProductStatusSelect({
  product,
  sellerUid,
  busy: busyExternal,
  className,
  onChanged,
  onError,
}: ProductStatusSelectProps) {
  const selectId = useId();
  const [busy, setBusy] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [pendingBuyers, setPendingBuyers] = useState<
    Array<{ buyerUid: string; buyerDisplayName: string }>
  >([]);
  const [pendingBuyerUid, setPendingBuyerUid] = useState<string | null>(null);
  const isBusy = busy || busyExternal;

  const current: ManageableStatus =
    product.status === "reserved" || product.status === "sold"
      ? product.status
      : "selling";

  async function applyStatus(next: ManageableStatus) {
    if (next === current || isBusy) return;
    onError?.("");

    if (next === "reserved") {
      setBusy(true);
      try {
        const rooms = await listChatRoomsForProduct(sellerUid, product.id);
        if (rooms.length === 0) {
          onError?.(
            "예약중으로 표시하려면 먼저 구매자와 채팅을 시작해야 합니다.",
          );
          return;
        }
        const buyers = rooms.map((r) => ({
          buyerUid: r.buyerUid,
          buyerDisplayName: r.buyerDisplayName || "구매자",
        }));
        setPendingBuyers(buyers);
        setPendingBuyerUid(buyers[0]?.buyerUid ?? null);
        setReserveOpen(true);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "예약 준비에 실패했습니다.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (next === "sold") {
      if (product.status === "reserved") {
        if (!product.activeOrderId) {
          onError?.("예약 주문 정보가 없어 판매완료할 수 없습니다.");
          return;
        }
        setCompleteOpen(true);
        return;
      }

      const ok = window.confirm(
        `"${product.partName || product.title}" 상품을 판매완료 처리할까요?`,
      );
      if (!ok) return;
      setBusy(true);
      try {
        await getProductRepository().markOwnedProductSold(
          product.id,
          sellerUid,
        );
        onChanged?.({ ...product, status: "sold" });
      } catch (e) {
        onError?.(
          e instanceof Error ? e.message : "판매완료 처리에 실패했습니다.",
        );
      } finally {
        setBusy(false);
      }
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
        onChanged?.({
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
      return;
    }

    if (product.status === "sold") {
      onError?.("판매완료된 상품은 상태를 변경할 수 없습니다.");
    }
  }

  async function onCompleteSale(payload: CompleteSalePayload) {
    if (!product.activeOrderId) return;
    setBusy(true);
    try {
      await completeDirectTrade({
        orderId: product.activeOrderId,
        fulfillmentMethod: payload.fulfillmentMethod,
        shippingInfo: payload.shippingInfo,
      });
      setCompleteOpen(false);
      onChanged?.({
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

  async function onReserve(buyerUid: string) {
    if (!buyerUid) return;
    setBusy(true);
    try {
      const { orderId } = await createDirectTrade({
        productId: product.id,
        dealMethod: "meet",
        buyerUid,
      });
      setReserveOpen(false);
      setPendingBuyerUid(null);
      setPendingBuyers([]);
      onChanged?.({
        ...product,
        status: "reserved",
        activeOrderId: orderId,
        reservedBuyerUid: buyerUid,
      });
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "예약에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <label className={cn("relative block", className)}>
        <span className="sr-only">상품 상태</span>
        <select
          id={selectId}
          value={current}
          disabled={isBusy || current === "sold"}
          onChange={(e) => void applyStatus(e.target.value as ManageableStatus)}
          className={cn(selectBase, "border-border text-text")}
        >
          <option value="selling">판매중</option>
          <option value="reserved">예약중</option>
          <option value="sold">판매완료</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted">
          {isBusy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : current === "sold" ? null : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </label>

      {reserveOpen ? (
        <TradeMethodModal
          title={product.title}
          price={product.price}
          shippingFee={product.shippingFee ?? 0}
          busy={busy}
          buyers={pendingBuyers}
          initialBuyerUid={pendingBuyerUid}
          onClose={() => {
            if (busy) return;
            setReserveOpen(false);
            setPendingBuyerUid(null);
            setPendingBuyers([]);
          }}
          onSelect={(buyerUid) => void onReserve(buyerUid)}
        />
      ) : null}

      {completeOpen ? (
        <CompleteSaleModal
          title={product.partName || product.title}
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

export function statusLabel(status: ProductStatus | string | undefined) {
  if (status === "reserved") return "예약중";
  if (status === "sold") return "판매완료";
  if (status === "selling") return "판매중";
  return status ?? "";
}
