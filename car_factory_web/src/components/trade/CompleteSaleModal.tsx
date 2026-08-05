"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, X } from "lucide-react";
import type {
  FulfillmentMethod,
  TradeShippingInfo,
} from "@/types/trade";
import { cn } from "@/lib/utils";

export const COURIER_OPTIONS = [
  "CJ대한통운",
  "한진택배",
  "롯데택배",
  "우체국택배",
  "로젠택배",
  "경동택배",
  "대신택배",
  "CU편의점택배",
  "GS Postbox",
  "기타",
] as const;

export type CompleteSalePayload = {
  fulfillmentMethod: FulfillmentMethod;
  shippingInfo: TradeShippingInfo | null;
};

export function CompleteSaleModal({
  title,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (payload: CompleteSalePayload) => void;
}) {
  const titleId = useId();
  const [method, setMethod] = useState<FulfillmentMethod | null>(null);
  const [carrier, setCarrier] = useState<(typeof COURIER_OPTIONS)[number] | "">(
    "",
  );
  const [trackingNumber, setTrackingNumber] = useState("");

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

  const deliveryReady =
    method === "delivery" &&
    Boolean(carrier) &&
    trackingNumber.trim().length >= 4;

  const canSubmit =
    method === "meetup" || (method === "delivery" && deliveryReady);

  function submit() {
    if (!method || !canSubmit || busy) return;
    if (method === "meetup") {
      onConfirm({ fulfillmentMethod: "meetup", shippingInfo: null });
      return;
    }
    onConfirm({
      fulfillmentMethod: "delivery",
      shippingInfo: {
        carrier,
        trackingNumber: trackingNumber.trim(),
      },
    });
  }

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
            판매완료
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
        <p className="mb-4 line-clamp-2 text-sm text-text-secondary">{title}</p>

        <p className="mb-2 text-sm font-bold text-text">거래 방식</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setMethod("meetup")}
            className={cn(
              "rounded-lg border px-3 py-3 text-left disabled:opacity-60",
              method === "meetup"
                ? "border-primary bg-primary-light"
                : "border-border hover:border-primary/60",
            )}
          >
            <span className="block text-sm font-bold text-text">직거래</span>
            <span className="mt-0.5 block text-xs text-text-muted">
              만나서 거래 완료
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setMethod("delivery")}
            className={cn(
              "rounded-lg border px-3 py-3 text-left disabled:opacity-60",
              method === "delivery"
                ? "border-primary bg-primary-light"
                : "border-border hover:border-primary/60",
            )}
          >
            <span className="block text-sm font-bold text-text">택배거래</span>
            <span className="mt-0.5 block text-xs text-text-muted">
              운송장 입력 후 완료
            </span>
          </button>
        </div>

        {method === "delivery" ? (
          <div className="mb-4 space-y-3 rounded-lg border border-border bg-bg p-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-text">
                택배사
              </span>
              <select
                value={carrier}
                disabled={busy}
                onChange={(e) =>
                  setCarrier(
                    e.target.value as (typeof COURIER_OPTIONS)[number] | "",
                  )
                }
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              >
                <option value="">택배사 선택</option>
                {COURIER_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-text">
                운송장 번호
              </span>
              <input
                type="text"
                value={trackingNumber}
                disabled={busy}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="운송장 번호를 입력하세요"
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
            </label>
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy || !canSubmit}
          onClick={submit}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              처리 중…
            </>
          ) : (
            "판매완료"
          )}
        </button>
        {!method ? (
          <p className="mt-3 text-xs text-text-muted">
            직거래 또는 택배거래를 선택한 뒤 판매완료할 수 있습니다.
          </p>
        ) : method === "delivery" && !deliveryReady ? (
          <p className="mt-3 text-xs text-text-muted">
            택배사와 운송장 번호를 입력해야 판매완료할 수 있습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
