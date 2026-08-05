"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  title: string;
  productId: string;
};

export function ProductGallery({
  images,
  title,
  productId,
}: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  const currentSrc = images[selected] ?? images[0] ?? "";

  function openOriginal() {
    if (!currentSrc) return;
    const url = `/image-viewer?src=${encodeURIComponent(currentSrc)}&title=${encodeURIComponent(title)}`;
    const width = Math.min(
      1440,
      Math.max(960, Math.round(window.screen.availWidth * 0.8)),
    );
    const height = Math.min(
      960,
      Math.max(720, Math.round(window.screen.availHeight * 0.8)),
    );
    const left = Math.max(
      0,
      Math.round(window.screenX + (window.outerWidth - width) / 2),
    );
    const top = Math.max(
      0,
      Math.round(window.screenY + (window.outerHeight - height) / 2),
    );
    window.open(
      url,
      "carfactory-image-viewer",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentSrc}
          alt={title}
          className="h-full w-full object-cover"
          decoding="async"
        />
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={openOriginal}
            className="flex size-10 items-center justify-center rounded-lg bg-white/95 text-text-secondary shadow-sm transition hover:text-primary"
            aria-label="원본 보기"
            title="원본 보기"
          >
            <Expand className="size-5" />
          </button>
          <FavoriteButton
            productId={productId}
            className="flex size-10 items-center justify-center rounded-lg shadow-sm transition"
            inactiveClassName="bg-white/95 text-text-secondary hover:text-primary"
            activeClassName="bg-white/95 text-red-500 hover:text-red-600"
            iconClassName="size-5"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setSelected(i)}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100",
              selected === i ? "border-primary" : "border-transparent",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
