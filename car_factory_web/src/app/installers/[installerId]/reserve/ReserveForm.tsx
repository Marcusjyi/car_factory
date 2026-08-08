"use client";

import { useState } from "react";
import { createPartnerReservation } from "@/features/partners/partner-reservation-repository";

type Props = {
  partner: {
    id: string;
    name: string;
    region: string;
    address: string;
    phone: string;
  };
};

const TIME_OPTIONS = ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export function InstallerReserveForm({ partner }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    setSubmitting(true);
    try {
      const id = await createPartnerReservation({
        customerName: String(fd.get("name") ?? ""),
        customerPhone: String(fd.get("phone") ?? ""),
        preferredDate: String(fd.get("date") ?? ""),
        preferredTime: String(fd.get("time") ?? ""),
        partOrOrder: String(fd.get("part") ?? ""),
        memo: String(fd.get("memo") ?? ""),
        partnerId: partner.id,
        partnerName: partner.name,
        partnerRegion: partner.region,
        partnerAddress: partner.address,
        partnerPhone: partner.phone,
        source: "web",
      });
      setDoneId(id);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (doneId) {
    return (
      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="text-base font-bold text-text">예약 신청 완료</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          {partner.name} 예약 신청이 접수되었습니다. 매장에서 확인 후
          연락드릴 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => setDoneId(null)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          추가 예약하기
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 border-t border-border pt-6"
      onSubmit={onSubmit}
    >
      <h2 className="text-base font-bold text-text">예약 정보</h2>

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-semibold text-text"
        >
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="예약자 이름"
          className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1.5 block text-sm font-semibold text-text"
        >
          연락처
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          maxLength={20}
          placeholder="010-0000-0000"
          className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="date"
            className="mb-1.5 block text-sm font-semibold text-text"
          >
            희망 날짜
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
          />
        </div>
        <div>
          <label
            htmlFor="time"
            className="mb-1.5 block text-sm font-semibold text-text"
          >
            희망 시간
          </label>
          <select
            id="time"
            name="time"
            required
            defaultValue=""
            className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
          >
            <option value="" disabled>
              시간 선택
            </option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="part"
          className="mb-1.5 block text-sm font-semibold text-text"
        >
          장착 부품 / 주문번호
        </label>
        <input
          id="part"
          name="part"
          type="text"
          maxLength={200}
          placeholder="예: 헤드램프 / CF-2026-0012"
          className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
        />
      </div>

      <div>
        <label
          htmlFor="memo"
          className="mb-1.5 block text-sm font-semibold text-text"
        >
          요청 사항
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={4}
          maxLength={2000}
          placeholder="차량 정보, 특이사항 등을 적어 주세요"
          className="w-full rounded-lg border border-border-strong bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
        />
      </div>

      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {submitting ? "신청 중…" : "예약 신청하기"}
      </button>
      <p className="text-center text-xs text-text-muted">
        * 신청 내용은 카팩토리에 저장되며, 매장 확인 후 연락드릴 수 있습니다.
      </p>
    </form>
  );
}
