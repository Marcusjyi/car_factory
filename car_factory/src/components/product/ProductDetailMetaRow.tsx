"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Truck, Wrench } from "lucide-react";
import { AuthContext } from "@/features/auth/AuthProvider";
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

const chipClass =
  "inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-text";

type ProductDetailMetaRowProps = {
  productId: string;
  sellerUid: string;
  shippingLabel: string;
  initialStatus: ProductStatus;
  initialActiveOrderId?: string | null;
  initialReservedBuyerUid?: string | null;
};

export function ProductDetailMetaRow({
  productId,
  sellerUid,
  shippingLabel,
  initialStatus,
  initialActiveOrderId,
  initialReservedBuyerUid,
}: ProductDetailMetaRowProps) {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const uid =
    auth?.status === "authenticated" ? auth.firebaseUser?.uid : undefined;
  const isOwner = Boolean(uid && uid === sellerUid);

  const [product, setProduct] = useState<ProductPublicDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [pendingBuyers, setPendingBuyers] = useState<
    Array<{ buyerUid: string; buyerDisplayName: string }>
  >([]);
  const [pendingBuyerUid, setPendingBuyerUid] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner || !uid) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    void getProductRepository()
      .getOwnedProduct(productId, uid)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch(() => {
        if (!cancelled) {
          setProduct({
            id: productId,
            title: "",
            price: 0,
            thumbnailURL: "",
            images: [],
            location: null,
            condition: "used",
            conditionGrade: null,
            conditionDescription: "",
            manufacturer: "",
            vehicleMakeId: "",
            vehicleModelId: "",
            vehicleModelName: "",
            modelYearFrom: null,
            modelYearTo: null,
            partName: "",
            partNumber: "",
            categoryId: "",
            description: "",
            shippingFeeType: "separate",
            shippingFee: 0,
            viewCount: 0,
            sellerUid,
            sellerDisplayName: "",
            status: initialStatus,
            reservedBuyerUid: initialReservedBuyerUid ?? null,
            activeOrderId: initialActiveOrderId ?? null,
            createdAt: "",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    initialActiveOrderId,
    initialReservedBuyerUid,
    initialStatus,
    isOwner,
    productId,
    sellerUid,
    uid,
  ]);

  const current: ManageableStatus =
    product?.status === "reserved" || product?.status === "sold"
      ? product.status
      : product?.status === "selling"
        ? "selling"
        : initialStatus === "reserved" || initialStatus === "sold"
          ? initialStatus
          : "selling";

  async function applyStatus(next: ManageableStatus) {
    if (!product || !uid || next === current || busy) return;
    setError(null);

    if (next === "reserved") {
      setBusy(true);
      try {
        const rooms = await listChatRoomsForProduct(uid, product.id);
        if (rooms.length === 0) {
          setError("예약중으로 표시하려면 먼저 구매자와 채팅하세요.");
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
        setError(e instanceof Error ? e.message : "예약 준비에 실패했습니다.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (next === "sold") {
      if (product.status === "reserved") {
        if (!product.activeOrderId) {
          setError("예약 주문 정보가 없어 판매완료할 수 없습니다.");
          return;
        }
        setCompleteOpen(true);
        return;
      }
      if (
        !window.confirm(
          `"${product.partName || product.title || "상품"}"을 판매완료 처리할까요?`,
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        await getProductRepository().markOwnedProductSold(product.id, uid);
        setProduct({ ...product, status: "sold" });
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "판매완료 처리에 실패했습니다.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    if (product.status === "reserved") {
      if (!product.activeOrderId) {
        setError("예약 주문 정보가 없어 취소할 수 없습니다.");
        return;
      }
      if (!window.confirm("예약을 취소하고 판매중으로 바꿀까요?")) return;
      setBusy(true);
      try {
        await cancelDirectTrade({ orderId: product.activeOrderId });
        setProduct({
          ...product,
          status: "selling",
          activeOrderId: null,
          reservedBuyerUid: null,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "예약 취소에 실패했습니다.");
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
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "판매완료 처리에 실패했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onReserve(buyerUid: string) {
    if (!product || !buyerUid) return;
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
      setProduct({
        ...product,
        status: "reserved",
        activeOrderId: orderId,
        reservedBuyerUid: buyerUid,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "예약에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className={chipClass}>
          <Truck className="size-4 shrink-0 text-primary" />
          {shippingLabel}
        </div>
        <Link
          href="/installers"
          className={cn(
            chipClass,
            "transition hover:border-primary hover:text-primary",
          )}
        >
          <Wrench className="size-4 shrink-0 text-primary" />
          장착 대행점
        </Link>

        {isOwner ? (
          <label className="relative inline-flex">
            <span className="sr-only">판매 상태</span>
            <select
              value={current}
              disabled={busy || current === "sold"}
              onChange={(e) =>
                void applyStatus(e.target.value as ManageableStatus)
              }
              className={cn(
                chipClass,
                "cursor-pointer appearance-none pr-9 font-semibold text-text outline-none focus:border-primary disabled:cursor-default disabled:opacity-100",
              )}
            >
              <option value="selling">판매중</option>
              <option value="reserved">예약중</option>
              <option value="sold">판매완료</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-text-muted">
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : current === "sold" ? null : (
                <ChevronDown className="size-3.5" />
              )}
            </span>
          </label>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {reserveOpen && product ? (
        <TradeMethodModal
          title={product.title || "상품"}
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

      {completeOpen && product ? (
        <CompleteSaleModal
          title={product.partName || product.title || "상품"}
          busy={busy}
          onClose={() => {
            if (busy) return;
            setCompleteOpen(false);
          }}
          onConfirm={(payload) => void onCompleteSale(payload)}
        />
      ) : null}
    </div>
  );
}
