"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui/card";
import { listPartnerReservations } from "@/lib/firestore/client";
import type { PartnerReservation } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";

const STATUS_LABEL: Record<PartnerReservation["status"], string> = {
  pending: "대기",
  confirmed: "확정",
  cancelled: "취소",
  completed: "완료",
};

export default function PartnerReservationsPage() {
  const [rows, setRows] = useState<PartnerReservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listPartnerReservations();
        if (!cancelled) setRows(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "예약 목록을 불러오지 못했습니다.",
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
        title="장착 예약"
        description="언제 · 누가 · 어느 지점을 예약했는지 확인합니다."
      />
      <Card className="overflow-x-auto p-0">
        {loading ? (
          <p className="p-6 text-sm text-[#6B7280]">불러오는 중…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[#6B7280]">예약이 없습니다.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E0E0E0] bg-[#F9FAFB] text-xs text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-medium">신청시각</th>
                <th className="px-4 py-3 font-medium">예약자</th>
                <th className="px-4 py-3 font-medium">지점</th>
                <th className="px-4 py-3 font-medium">희망일시</th>
                <th className="px-4 py-3 font-medium">부품/주문</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">출처</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#E0E0E0] last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[#6B7280]">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#464646]">
                      {r.customerName}
                    </p>
                    <p className="text-xs text-[#6B7280]">{r.customerPhone}</p>
                    {r.uid ? (
                      <p className="text-[11px] text-[#9CA3AF]">uid: {r.uid}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#464646]">
                      {r.partnerName}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {[r.partnerRegion, r.partnerAddress]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#464646]">
                    {r.preferredDate} {r.preferredTime}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-[#6B7280]">
                    {r.partOrOrder || r.memo || "—"}
                  </td>
                  <td className="px-4 py-3">{STATUS_LABEL[r.status]}</td>
                  <td className="px-4 py-3 uppercase text-[#6B7280]">
                    {r.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
