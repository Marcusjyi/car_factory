"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { AuthContext } from "@/features/auth/AuthProvider";
import {
  listMyBuyTrades,
  listMySellTrades,
  tradeStatusLabel,
} from "@/features/trades/trade-repository";
import { hideDirectTradeFromHistory } from "@/features/trades/trade-api";
import { getParcelTrackingUrl } from "@/features/trades/parcel-tracking";
import type { DirectTradeDto, DirectTradeStatus } from "@/types/trade";
import { cn, formatPrice } from "@/lib/utils";

type Tab = "buy" | "sell";

const appleSans =
  "font-[-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display',Segoe_UI,sans-serif]";

function statusColor(status: DirectTradeStatus) {
  if (status === "cancelled") return "text-[#ff3b30]";
  if (status === "completed") return "text-[#34c759]";
  return "text-[#0071e3]";
}

function formatLongDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function OrdersListClient() {
  const auth = useContext(AuthContext);
  const [tab, setTab] = useState<Tab>("buy");
  const [buy, setBuy] = useState<DirectTradeDto[]>([]);
  const [sell, setSell] = useState<DirectTradeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.status === "loading") return;
    if (auth?.status !== "authenticated" || !auth.firebaseUser) {
      setBuy([]);
      setSell([]);
      setLoading(false);
      return;
    }
    const uid = auth.firebaseUser.uid;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [b, s] = await Promise.all([
          listMyBuyTrades(uid),
          listMySellTrades(uid),
        ]);
        if (!cancelled) {
          setBuy(b);
          setSell(s);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth?.firebaseUser, auth?.status]);

  async function onDelete(e: React.MouseEvent, trade: DirectTradeDto) {
    e.preventDefault();
    e.stopPropagation();
    if (trade.status !== "cancelled" && trade.status !== "completed") return;
    const ok = window.confirm("이 거래를 내역에서 삭제할까요?");
    if (!ok) return;
    setDeletingId(trade.id);
    setError(null);
    try {
      await hideDirectTradeFromHistory(trade.id);
      if (tab === "buy") {
        setBuy((prev) => prev.filter((t) => t.id !== trade.id));
      } else {
        setSell((prev) => prev.filter((t) => t.id !== trade.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  if (auth?.status === "loading" || loading) {
    return (
      <div className={cn("flex justify-center py-20 text-[#86868b]", appleSans)}>
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (auth?.status !== "authenticated") {
    return (
      <p className={cn("py-16 text-center text-[15px] text-[#86868b]", appleSans)}>
        로그인 후 거래 내역을 확인할 수 있습니다.
      </p>
    );
  }

  const items = tab === "buy" ? buy : sell;
  const uid = auth.firebaseUser?.uid ?? "";

  return (
    <div className={cn("mt-8", appleSans)}>
      <div className="mx-auto mb-6 grid max-w-[280px] grid-cols-2 rounded-full bg-[#e8e8ed] p-1">
        {(
          [
            { id: "buy" as const, label: "구매", count: buy.length },
            { id: "sell" as const, label: "판매", count: sell.length },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full py-1.5 text-[13px] font-medium transition",
              tab === item.id
                ? "bg-white text-[#1d1d1f] shadow-sm"
                : "text-[#6e6e73]",
            )}
          >
            {item.label} {item.count}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 text-center text-[13px] text-[#ff3b30]">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="py-20 text-center text-[15px] text-[#86868b]">
          {tab === "buy" ? "구매 내역이 없습니다." : "판매 내역이 없습니다."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
          {items.map((trade, index) => {
            const canDelete =
              trade.status === "cancelled" || trade.status === "completed";
            const peer =
              trade.buyerUid === uid
                ? trade.sellerDisplayName || "판매자"
                : trade.buyerDisplayName || "구매자";
            const trackingUrl = getParcelTrackingUrl(trade.shippingInfo);

            return (
              <li
                key={trade.id}
                className={cn(
                  index > 0 && "border-t border-black/[0.06]",
                )}
              >
                <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
                  <Link
                    href={`/orders/${trade.id}`}
                    className="relative size-[64px] shrink-0 overflow-hidden rounded-[12px] bg-[#f5f5f7]"
                  >
                    {trade.productSnapshot.thumbnailURL ? (
                      <Image
                        src={trade.productSnapshot.thumbnailURL}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : null}
                  </Link>

                  <Link
                    href={`/orders/${trade.id}`}
                    className="min-w-0 flex-1 transition hover:opacity-80"
                  >
                    <p
                      className={cn(
                        "text-[12px] font-medium tracking-[-0.01em]",
                        statusColor(trade.status),
                      )}
                    >
                      {tradeStatusLabel(trade.status)}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                      {trade.productSnapshot.title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] tracking-[-0.01em] text-[#86868b]">
                      {[
                        peer,
                        formatLongDate(trade.reservedAt || trade.createdAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1.5 text-[15px] font-semibold tabular-nums tracking-[-0.02em] text-[#1d1d1f]">
                      {formatPrice(trade.totalAmount)}
                    </p>
                  </Link>

                  <div className="flex shrink-0 items-center gap-3 self-center">
                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium text-[#0071e3] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        택배조회
                      </a>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        disabled={deletingId === trade.id}
                        onClick={(e) => void onDelete(e, trade)}
                        className="text-[13px] font-medium text-[#0071e3] hover:underline disabled:opacity-50"
                      >
                        {deletingId === trade.id ? "삭제 중" : "삭제"}
                      </button>
                    ) : null}
                    <Link
                      href={`/orders/${trade.id}`}
                      aria-label="상세보기"
                      className="text-[#c7c7cc]"
                    >
                      <ChevronRight className="size-5" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
