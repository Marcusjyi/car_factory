"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  PARTNER_HOLIDAY_MODE_OPTIONS,
  PARTNER_HOUR_OPTIONS,
  PARTNER_MINUTE_OPTIONS,
  formatTimeRange,
  type HolidayMode,
  type HoursState,
  type TimeHM,
} from "@/lib/partners/options";
import { WheelColumn } from "./wheel-select";

function TimeRangeWheels({
  open,
  close,
  onOpenChange,
  onCloseChange,
}: {
  open: TimeHM;
  close: TimeHM;
  onOpenChange: (next: TimeHM) => void;
  onCloseChange: (next: TimeHM) => void;
}) {
  return (
    <div className="cf-wheel-range">
      <WheelColumn
        ariaLabel="시작 시"
        options={PARTNER_HOUR_OPTIONS}
        value={open.hour}
        onChange={(hour) => onOpenChange({ ...open, hour })}
      />
      <span className="cf-wheel-colon">:</span>
      <WheelColumn
        ariaLabel="시작 분"
        options={PARTNER_MINUTE_OPTIONS}
        value={open.minute}
        onChange={(minute) => onOpenChange({ ...open, minute })}
      />
      <span className="cf-wheel-dash">–</span>
      <WheelColumn
        ariaLabel="종료 시"
        options={PARTNER_HOUR_OPTIONS}
        value={close.hour}
        onChange={(hour) => onCloseChange({ ...close, hour })}
      />
      <span className="cf-wheel-colon">:</span>
      <WheelColumn
        ariaLabel="종료 분"
        options={PARTNER_MINUTE_OPTIONS}
        value={close.minute}
        onChange={(minute) => onCloseChange({ ...close, minute })}
      />
    </div>
  );
}

function HoursModal({
  title,
  open,
  onClose,
  onConfirm,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 id={titleId} className="text-base font-semibold text-[#464646]">
            {title}
          </h2>
          <p className="text-[11px] text-[#9CA3AF]">30분 단위</p>
        </div>
        <div className="px-5 py-3">{children}</div>
        <div className="flex gap-2 px-5 pb-5 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            취소
          </Button>
          <Button type="button" className="flex-1" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}

function HoursSlot({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[#464646]">{label}</p>
      <button
        type="button"
        onClick={onClick}
        className="flex h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-[#E0E0E0] bg-white px-3 text-left transition hover:border-[#C8C8C8]"
      >
        <span className="truncate font-mono text-sm font-medium text-[#464646]">
          {value}
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-[#9CA3AF]">
          선택
        </span>
      </button>
    </div>
  );
}

export function PartnerHoursField({
  value,
  onChange,
}: {
  value: HoursState;
  onChange: (next: HoursState) => void;
}) {
  const [weekdayOpen, setWeekdayOpen] = useState(false);
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [weekdayDraft, setWeekdayDraft] = useState({
    open: value.weekdayOpen,
    close: value.weekdayClose,
  });
  const [holidayDraft, setHolidayDraft] = useState({
    mode: value.holidayMode,
    open: value.holidayOpen,
    close: value.holidayClose,
  });

  const holidayLabel =
    value.holidayMode === "운영"
      ? formatTimeRange(value.holidayOpen, value.holidayClose)
      : value.holidayMode;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <HoursSlot
          label="평일"
          value={formatTimeRange(value.weekdayOpen, value.weekdayClose)}
          onClick={() => {
            setWeekdayDraft({
              open: value.weekdayOpen,
              close: value.weekdayClose,
            });
            setWeekdayOpen(true);
          }}
        />
        <HoursSlot
          label="휴일 · 공휴일"
          value={holidayLabel}
          onClick={() => {
            setHolidayDraft({
              mode: value.holidayMode,
              open: value.holidayOpen,
              close: value.holidayClose,
            });
            setHolidayOpen(true);
          }}
        />
      </div>

      <HoursModal
        title="평일 영업시간"
        open={weekdayOpen}
        onClose={() => setWeekdayOpen(false)}
        onConfirm={() => {
          onChange({
            ...value,
            weekdayOpen: weekdayDraft.open,
            weekdayClose: weekdayDraft.close,
          });
          setWeekdayOpen(false);
        }}
      >
        <p className="mb-3 text-center font-mono text-sm font-semibold text-[#464646]">
          {formatTimeRange(weekdayDraft.open, weekdayDraft.close)}
        </p>
        <TimeRangeWheels
          open={weekdayDraft.open}
          close={weekdayDraft.close}
          onOpenChange={(open) => setWeekdayDraft((d) => ({ ...d, open }))}
          onCloseChange={(close) => setWeekdayDraft((d) => ({ ...d, close }))}
        />
      </HoursModal>

      <HoursModal
        title="휴일 · 공휴일"
        open={holidayOpen}
        onClose={() => setHolidayOpen(false)}
        onConfirm={() => {
          onChange({
            ...value,
            holidayMode: holidayDraft.mode,
            holidayOpen: holidayDraft.open,
            holidayClose: holidayDraft.close,
          });
          setHolidayOpen(false);
        }}
      >
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {PARTNER_HOLIDAY_MODE_OPTIONS.map((mode) => {
            const selected = holidayDraft.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setHolidayDraft((d) => ({
                    ...d,
                    mode: mode as HolidayMode,
                  }))
                }
                className={cn(
                  "rounded-lg py-2 text-xs font-semibold transition",
                  selected
                    ? "bg-[#464646] text-white"
                    : "bg-[#F5F5F5] text-[#6B7280] hover:bg-[#EBEBEB]",
                )}
              >
                {mode}
              </button>
            );
          })}
        </div>
        {holidayDraft.mode === "운영" ? (
          <>
            <p className="mb-3 text-center font-mono text-sm font-semibold text-[#464646]">
              {formatTimeRange(holidayDraft.open, holidayDraft.close)}
            </p>
            <TimeRangeWheels
              open={holidayDraft.open}
              close={holidayDraft.close}
              onOpenChange={(open) =>
                setHolidayDraft((d) => ({ ...d, open }))
              }
              onCloseChange={(close) =>
                setHolidayDraft((d) => ({ ...d, close }))
              }
            />
          </>
        ) : (
          <p className="py-6 text-center text-sm text-[#9CA3AF]">
            {holidayDraft.mode === "휴무"
              ? "휴일·공휴일은 휴무로 표시됩니다."
              : "휴일·공휴일은 예약제로 표시됩니다."}
          </p>
        )}
      </HoursModal>
    </>
  );
}
