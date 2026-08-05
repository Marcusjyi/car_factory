"use client";

import { useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthContext } from "@/features/auth/AuthProvider";
import {
  cancelDirectTrade,
  completeDirectTrade,
  setTradeTransferInfo,
} from "@/features/trades/trade-api";
import { getOrCreateChatRoom } from "@/features/chat/chat-api";
import {
  fulfillmentMethodLabel,
  getTrade,
  tradeStatusLabel,
} from "@/features/trades/trade-repository";
import { getParcelTrackingUrl } from "@/features/trades/parcel-tracking";
import {
  CompleteSaleModal,
  type CompleteSalePayload,
} from "@/components/trade/CompleteSaleModal";
import type { DirectTradeDto } from "@/types/trade";
import { cn, formatPrice } from "@/lib/utils";

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [trade, setTrade] = useState<DirectTradeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const reload = useCallback(async () => {
    const next = await getTrade(orderId);
    setTrade(next);
    if (next?.transferInfo) {
      setBankName(next.transferInfo.bankName);
      setAccountNumber(next.transferInfo.accountNumber);
      setAccountHolder(next.transferInfo.accountHolder);
    }
  }, [orderId]);

  useEffect(() => {
    if (auth?.status === "loading") return;
    if (auth?.status !== "authenticated") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth?.status, reload]);

  const uid = auth?.firebaseUser?.uid;
  const isBuyer = Boolean(trade && uid === trade.buyerUid);
  const isSeller = Boolean(trade && uid === trade.sellerUid);

  useEffect(() => {
    if (!trade || !isSeller) return;
    if (trade.transferInfo) return;
    if (trade.dealMethod !== "transfer") return;
    const account = auth?.user?.defaultTransferAccount;
    if (!account) return;
    setBankName((prev) => prev || account.bankName || "");
    setAccountNumber((prev) => prev || account.accountNumber || "");
    setAccountHolder((prev) => prev || account.accountHolder || "");
  }, [auth?.user?.defaultTransferAccount, isSeller, trade]);

  async function onCancel() {
    if (!trade) return;
    const ok = window.confirm("이 예약을 취소할까요? 상품이 다시 판매중으로 바뀝니다.");
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await cancelDirectTrade({ orderId: trade.id });
      await reload();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "취소에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onComplete(payload: CompleteSalePayload) {
    if (!trade) return;
    setBusy(true);
    setError(null);
    try {
      await completeDirectTrade({
        orderId: trade.id,
        fulfillmentMethod: payload.fulfillmentMethod,
        shippingInfo: payload.shippingInfo,
      });
      setCompleteOpen(false);
      await reload();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "완료 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveTransfer() {
    if (!trade) return;
    setBusy(true);
    setError(null);
    try {
      await setTradeTransferInfo({
        orderId: trade.id,
        bankName,
        accountNumber,
        accountHolder,
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "계좌 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onOpenChat() {
    if (!trade) return;
    setBusy(true);
    setError(null);
    try {
      const roomId = await getOrCreateChatRoom(trade.productId, {
        buyerUid: trade.buyerUid,
      });
      router.push(`/chat/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "채팅방을 열 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (auth?.status === "loading" || loading) {
    return (
      <div className="flex justify-center py-20 text-[#86868b]">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (auth?.status !== "authenticated") {
    return (
      <div className="rounded-[18px] bg-white px-6 py-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        <p className="text-[15px] text-[#86868b]">로그인이 필요합니다.</p>
        <Link
          href={`/login?next=/orders/${orderId}`}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#0071e3] px-6 text-[15px] font-medium text-white"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!trade || (!isBuyer && !isSeller)) {
    return (
      <div className="rounded-[18px] bg-white px-6 py-10 text-center text-[15px] text-[#86868b] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        거래를 찾을 수 없거나 권한이 없습니다.
      </div>
    );
  }

  const statusTone =
    trade.status === "cancelled"
      ? "text-[#ff3b30]"
      : trade.status === "completed"
        ? "text-[#34c759]"
        : "text-[#0071e3]";
  const trackingUrl = getParcelTrackingUrl(trade.shippingInfo);

  return (
    <div
      className={cn(
        "space-y-4 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',Segoe_UI,sans-serif]",
      )}
    >
      <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        <div className="flex gap-4 p-5 sm:p-6">
          <Link
            href={`/parts/${trade.productId}`}
            className="relative size-[88px] shrink-0 overflow-hidden rounded-[14px] bg-[#f5f5f7] sm:size-[104px]"
          >
            {trade.productSnapshot.thumbnailURL ? (
              <Image
                src={trade.productSnapshot.thumbnailURL}
                alt=""
                fill
                className="object-cover"
                sizes="104px"
              />
            ) : null}
          </Link>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[13px] font-medium", statusTone)}>
              {tradeStatusLabel(trade.status)}
            </p>
            <Link
              href={`/parts/${trade.productId}`}
              className="mt-1 block text-[19px] font-semibold leading-snug tracking-[-0.03em] text-[#1d1d1f] hover:opacity-80"
            >
              {trade.productSnapshot.title}
            </Link>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] tabular-nums text-[#1d1d1f]">
              {formatPrice(trade.totalAmount)}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        {trade.fulfillmentMethod ? (
          <MetaRow label="인도 방식">
            {fulfillmentMethodLabel(trade.fulfillmentMethod)}
          </MetaRow>
        ) : null}
        {trade.productSnapshot.partNumber ? (
          <MetaRow label="부품코드">{trade.productSnapshot.partNumber}</MetaRow>
        ) : null}
        <MetaRow label="주문번호">{trade.orderNumber}</MetaRow>
        <MetaRow label={isBuyer ? "판매자" : "구매자"} last>
          {isBuyer
            ? trade.sellerDisplayName || "판매자"
            : trade.buyerDisplayName || "구매자"}
        </MetaRow>
      </section>

      {trade.status === "completed" && trade.shippingInfo ? (
        <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
          <MetaRow label="택배사">{trade.shippingInfo.carrier}</MetaRow>
          <MetaRow label="운송장" last>
            {trade.shippingInfo.trackingNumber}
          </MetaRow>
        </section>
      ) : null}

      {trade.dealMethod === "transfer" && trade.status === "reserved" ? (
        <section className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] sm:p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
            계좌이체 정보
          </h2>
          {isSeller ? (
            <div className="mt-4 space-y-3">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="은행명"
                className="h-12 w-full rounded-[12px] bg-[#f5f5f7] px-4 text-[15px] text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
              />
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="계좌번호"
                className="h-12 w-full rounded-[12px] bg-[#f5f5f7] px-4 text-[15px] text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
              />
              <input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="예금주"
                className="h-12 w-full rounded-[12px] bg-[#f5f5f7] px-4 text-[15px] text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void onSaveTransfer()}
                className="h-12 w-full rounded-full bg-[#0071e3] text-[15px] font-medium text-white disabled:opacity-50"
              >
                계좌 정보 저장
              </button>
            </div>
          ) : trade.transferInfo ? (
            <dl className="mt-4 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868b]">은행</dt>
                <dd className="font-medium text-[#1d1d1f]">
                  {trade.transferInfo.bankName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868b]">계좌번호</dt>
                <dd className="font-medium text-[#1d1d1f]">
                  {trade.transferInfo.accountNumber}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868b]">예금주</dt>
                <dd className="font-medium text-[#1d1d1f]">
                  {trade.transferInfo.accountHolder}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-[14px] leading-relaxed text-[#86868b]">
              판매자가 아직 계좌를 등록하지 않았습니다.
            </p>
          )}
        </section>
      ) : null}

      {error ? (
        <p className="text-center text-[13px] text-[#ff3b30]">{error}</p>
      ) : null}

      {trade.status === "completed" ? (
        <div className="flex flex-col gap-2.5 pt-1">
          {trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#0071e3] text-[15px] font-medium text-white"
            >
              택배조회
            </a>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onOpenChat()}
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium disabled:opacity-50",
              trackingUrl
                ? "bg-[#e8e8ed] text-[#1d1d1f]"
                : "bg-[#0071e3] text-white",
            )}
          >
            상대방과 채팅
          </button>
          <Link
            href="/mypage/orders"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#e8e8ed] text-[15px] font-medium text-[#1d1d1f]"
          >
            거래 내역으로
          </Link>
        </div>
      ) : trade.status === "reserved" ? (
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onOpenChat()}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#0071e3] text-[15px] font-medium text-white disabled:opacity-50"
          >
            채팅하기
          </button>
          {isSeller ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCancel()}
                className="flex h-12 items-center justify-center rounded-full bg-[#e8e8ed] text-[15px] font-medium text-[#1d1d1f] disabled:opacity-50"
              >
                예약 취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setCompleteOpen(true)}
                className="flex h-12 items-center justify-center rounded-full bg-[#1d1d1f] text-[15px] font-medium text-white disabled:opacity-50"
              >
                판매완료
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pt-1">
          <Link
            href="/mypage/orders"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#e8e8ed] text-[15px] font-medium text-[#1d1d1f]"
          >
            거래 내역으로
          </Link>
        </div>
      )}

      {completeOpen ? (
        <CompleteSaleModal
          title={trade.productSnapshot.title}
          busy={busy}
          onClose={() => {
            if (busy) return;
            setCompleteOpen(false);
          }}
          onConfirm={(payload) => void onComplete(payload)}
        />
      ) : null}
    </div>
  );
}

function MetaRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6",
        !last && "border-b border-black/[0.06]",
      )}
    >
      <span className="shrink-0 text-[14px] text-[#86868b]">{label}</span>
      <span className="min-w-0 truncate text-right text-[14px] font-medium tracking-[-0.01em] text-[#1d1d1f]">
        {children}
      </span>
    </div>
  );
}
