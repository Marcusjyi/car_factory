"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

const ITEM_H = 40;

type WheelColumnProps = {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  className?: string;
  ariaLabel?: string;
};

export function WheelColumn({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: WheelColumnProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const snapTimerRef = useRef<number | null>(null);
  const list = [...options];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.max(0, list.indexOf(value));
    lockRef.current = true;
    el.scrollTop = idx * ITEM_H;
    const t = window.setTimeout(() => {
      lockRef.current = false;
    }, 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync to value only
  }, [value]);

  function clearSnapTimer() {
    if (snapTimerRef.current != null) {
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }

  function scrollToIndex(idx: number, smooth: boolean) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.min(Math.max(idx, 0), list.length - 1);
    lockRef.current = true;
    el.scrollTo({
      top: clamped * ITEM_H,
      behavior: smooth ? "smooth" : "auto",
    });
    window.setTimeout(
      () => {
        lockRef.current = false;
      },
      smooth ? 260 : 40,
    );
    return clamped;
  }

  function commitNearest(smooth = true) {
    const el = scrollerRef.current;
    if (!el || lockRef.current) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = scrollToIndex(idx, smooth);
    if (clamped == null) return;
    const next = list[clamped];
    if (next && next !== value) onChange(next);
  }

  function scheduleSnap() {
    clearSnapTimer();
    snapTimerRef.current = window.setTimeout(() => {
      snapTimerRef.current = null;
      commitNearest(true);
    }, 80);
  }

  function selectIndex(idx: number) {
    const clamped = scrollToIndex(idx, true);
    if (clamped == null) return;
    const next = list[clamped];
    if (next && next !== value) onChange(next);
  }

  return (
    <div
      className={cn("cf-wheel", className)}
      aria-label={ariaLabel}
      role="listbox"
    >
      <div
        ref={scrollerRef}
        className="cf-wheel-scroll"
        onScroll={() => {
          if (lockRef.current || dragRef.current) return;
          scheduleSnap();
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const el = scrollerRef.current;
          if (!el) return;
          clearSnapTimer();
          dragRef.current = {
            pointerId: e.pointerId,
            startY: e.clientY,
            startScroll: el.scrollTop,
            moved: false,
          };
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          const el = scrollerRef.current;
          if (!drag || drag.pointerId !== e.pointerId || !el) return;
          const dy = e.clientY - drag.startY;
          if (!drag.moved && Math.abs(dy) > 4) {
            drag.moved = true;
            suppressClickRef.current = true;
          }
          if (drag.moved) {
            el.scrollTop = drag.startScroll - dy;
          }
        }}
        onPointerUp={(e) => {
          const drag = dragRef.current;
          const el = scrollerRef.current;
          if (!drag || drag.pointerId !== e.pointerId) return;
          dragRef.current = null;
          if (el?.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId);
          }
          if (drag.moved) {
            commitNearest(true);
            window.setTimeout(() => {
              suppressClickRef.current = false;
            }, 0);
          }
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          suppressClickRef.current = false;
        }}
      >
        {list.map((opt, idx) => (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={opt === value}
            className="cf-wheel-item"
            data-active={opt === value ? "true" : "false"}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              selectIndex(idx);
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
