"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const STEP = 0.25;

function ImageViewerInner() {
  const searchParams = useSearchParams();
  const src = searchParams.get("src") ?? "";
  const title = searchParams.get("title") ?? "원본 보기";

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((prev + delta).toFixed(2)))),
    );
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    document.title = `${title} · 원본 보기`;
  }, [title]);

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? STEP : -STEP);
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "+" || e.key === "=") zoomBy(STEP);
      if (e.key === "-") zoomBy(-STEP);
      if (e.key === "0") reset();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomBy, reset]);

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  if (!src) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/70">
        이미지 주소가 없습니다.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <p className="min-w-0 truncate text-sm font-medium">{title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <ToolButton
            label="축소"
            onClick={() => zoomBy(-STEP)}
            icon={<ZoomOut className="size-4" />}
          />
          <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <ToolButton
            label="확대"
            onClick={() => zoomBy(STEP)}
            icon={<ZoomIn className="size-4" />}
          />
          <ToolButton
            label="원래 크기"
            onClick={reset}
            icon={<RotateCcw className="size-4" />}
          />
          <ToolButton
            label="창에 맞춤"
            onClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            icon={
              scale > 1 ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )
            }
          />
        </div>
      </header>

      <div
        ref={containerRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden",
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex h-full w-full items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={title}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: dragging.current ? "none" : "transform 80ms ease-out",
            }}
          />
        </div>
      </div>

      <p className="shrink-0 border-t border-white/10 px-4 py-2 text-center text-[11px] text-white/50">
        마우스 휠로 확대·축소 · 드래그로 이동 · + / - / 0 단축키
      </p>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
    >
      {icon}
    </button>
  );
}

export default function ImageViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/70">
          불러오는 중...
        </div>
      }
    >
      <ImageViewerInner />
    </Suspense>
  );
}
