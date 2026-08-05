"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui/card";
import { listOrders } from "@/lib/firestore/client";
import type { OrderRow } from "@/lib/types";
import { formatDateTime, formatPrice } from "@/lib/utils/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listOrders();
        if (!cancelled) setOrders(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "주문 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="주문"
        description={loading ? "거래/주문 목록" : `총 ${orders.length}건`}
      />
      <Card className="overflow-x-auto p-0">
        {loading ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">불러오는 중...</p>
        ) : null}
        {error ? (
          <p className="p-8 text-center text-sm text-red-600">{error}</p>
        ) : null}
        {!loading && !error && orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">주문이 없습니다.</p>
        ) : null}
        {orders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">금액</th>
                <th className="px-4 py-3 font-medium">구매자</th>
                <th className="px-4 py-3 font-medium">판매자</th>
                <th className="px-4 py-3 font-medium">일시</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-[#F0F0F0]">
                  <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">
                    {o.totalPrice != null
                      ? `${formatPrice(o.totalPrice)}원`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{o.buyerUid ?? "-"}</td>
                  <td className="px-4 py-3">{o.sellerUid ?? "-"}</td>
                  <td className="px-4 py-3">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Card>
    </div>
  );
}
