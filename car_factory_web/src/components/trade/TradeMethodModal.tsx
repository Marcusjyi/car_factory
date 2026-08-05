"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

export type ReserveBuyerOption = {
  buyerUid: string;
  buyerDisplayName: string;
};

/** 예약 시 거래 상대(구매자)만 선택 */
export function TradeMethodModal({
  title,
  price,
  shippingFee = 0,
  busy,
  buyers = [],
  initialBuyerUid = null,
  onClose,
  onSelect,
}: {
  title: string;
  price: number;
  shippingFee?: number;
  busy: boolean;
  buyers?: ReserveBuyerOption[];
  initialBuyerUid?: string | null;
  onClose: () => void;
  onSelect: (buyerUid: string) => void;
}) {
  const titleId = useId();
  const total = price + shippingFee;
  const [buyerUid, setBuyerUid] = useState(
    () => initialBuyerUid || buyers[0]?.buyerUid || "",
  );

  useEffect(() => {
    setBuyerUid(initialBuyerUid || buyers[0]?.buyerUid || "");
  }, [buyers, initialBuyerUid]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[420px] rounded-xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-text">
            거래 상대 선택
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-bg hover:text-text disabled:opacity-50"
            aria-label="닫기"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mb-1 line-clamp-2 text-sm text-text-secondary">{title}</p>
        <p className="mb-4 text-base font-bold text-text">{formatPrice(total)}</p>
        <p className="mb-3 text-xs text-text-muted">
          선택한 구매자와만 채팅이 유지됩니다. 다른 문의 채팅은 일시 중지됩니다.
        </p>

        <div className="mb-4 max-h-56 space-y-2 overflow-y-auto">
          {buyers.map((buyer) => {
            const selected = buyerUid === buyer.buyerUid;
            return (
              <button
                key={buyer.buyerUid}
                type="button"
                disabled={busy}
                onClick={() => setBuyerUid(buyer.buyerUid)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left disabled:opacity-60",
                  selected
                    ? "border-primary bg-primary-light"
                    : "border-border hover:border-primary/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-primary bg-primary"
                      : "border-border bg-white",
                  )}
                  aria-hidden
                >
                  {selected ? (
                    <span className="size-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                <span className="truncate text-sm font-semibold text-text">
                  {buyer.buyerDisplayName || "구매자"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busy || !buyerUid}
          onClick={() => onSelect(buyerUid)}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              예약 처리 중…
            </>
          ) : (
            "이 구매자와 예약"
          )}
        </button>
      </div>
    </div>
  );
}
