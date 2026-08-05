"use client";

import Link from "next/link";
import { CircleCheck, Loader2, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import type { Product } from "@/lib/mock-data";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { cn, formatPrice } from "@/lib/utils";

export type ProductCardOwnerActions = {
  canEdit?: boolean;
  canMarkSold?: boolean;
  canDelete?: boolean;
  busy?: boolean;
  onEdit?: () => void;
  onMarkSold?: () => void;
  onDelete?: () => void;
};

type ProductCardProps = {
  product: Product;
  className?: string;
  favorited?: boolean;
  /** 찜 상태 변경 시 (찜목록에서 해제 반영용) */
  onFavoriteChange?: (favorited: boolean) => void;
  /** 내 상점: 하트 숨기고 호버 시 액션 슬라이드 */
  ownerActions?: ProductCardOwnerActions;
  /** 찜목록: 호버 시 장바구니 이동 버튼 */
  showCartHover?: boolean;
};

export function ProductCard({
  product,
  className,
  favorited = false,
  onFavoriteChange,
  ownerActions,
  showCartHover = false,
}: ProductCardProps) {
  const isOwner = Boolean(ownerActions);
  const statusBadge =
    product.listingStatus === "reserved"
      ? { label: "예약중", className: "bg-[#016ff9] text-white" }
      : product.listingStatus === "sold"
        ? { label: "판매완료", className: "bg-[#016ff9] text-white" }
        : null;

  return (
    <article
      className={cn(
        "group w-full overflow-hidden rounded-[12px] border border-border bg-white transition hover:shadow-md",
        className,
      )}
    >
      <div className="relative">
        <Link href={`/parts/${product.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {statusBadge ? (
              <span
                className={cn(
                  "absolute right-2 top-2 z-[1] rounded-md px-2.5 py-1 text-xs font-bold shadow-sm",
                  statusBadge.className,
                )}
              >
                {statusBadge.label}
              </span>
            ) : null}
          </div>
          <div className="space-y-1.5 p-3">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-text">
              {product.title}
            </h3>
            {product.partNumber ? (
              <p className="truncate text-xs text-text-secondary">
                부품코드 {product.partNumber}
              </p>
            ) : null}
            <p className="text-base font-bold text-text">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-text-muted">
              {product.timeAgo} | {product.location}
            </p>
          </div>
        </Link>

        {/* 호버 액션은 상품 Link 밖에 두어 <a> 중첩 hydration 오류 방지 */}
        {isOwner ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[4/3] overflow-hidden",
            )}
          >
            <div
              className={cn(
                "pointer-events-auto absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/85 via-black/70 to-transparent px-2 pb-2.5 pt-10 transition-transform duration-300 ease-out",
                "group-hover:translate-y-0",
              )}
            >
              <div className="flex flex-col gap-1.5">
                {ownerActions?.canEdit || ownerActions?.canMarkSold ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {ownerActions?.canEdit ? (
                      <button
                        type="button"
                        disabled={ownerActions.busy}
                        onClick={() => ownerActions.onEdit?.()}
                        className={cn(
                          "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-white/95 text-xs font-semibold text-text hover:bg-white disabled:opacity-60",
                          !ownerActions.canMarkSold && "col-span-2",
                        )}
                      >
                        <Pencil className="size-3.5" />
                        수정
                      </button>
                    ) : null}
                    {ownerActions?.canMarkSold ? (
                      <button
                        type="button"
                        disabled={ownerActions.busy}
                        onClick={() => ownerActions.onMarkSold?.()}
                        className={cn(
                          "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-500 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60",
                          !ownerActions.canEdit && "col-span-2",
                        )}
                      >
                        {ownerActions.busy ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CircleCheck className="size-3.5" />
                        )}
                        판매완료
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={
                    ownerActions?.busy || ownerActions?.canDelete === false
                  }
                  onClick={() => ownerActions?.onDelete?.()}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-red-500 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {ownerActions?.busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  {ownerActions?.canDelete === false ? "예약중 · 삭제불가" : "삭제"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!isOwner && showCartHover ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[4/3] overflow-hidden">
            <div
              className={cn(
                "pointer-events-auto absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/85 via-black/70 to-transparent px-2 pb-2.5 pt-10 transition-transform duration-300 ease-out",
                "group-hover:translate-y-0",
              )}
            >
              <Link
                href="/cart"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-white/95 text-xs font-semibold text-text hover:bg-white"
              >
                <ShoppingCart className="size-4" />
                장바구니로 이동
              </Link>
            </div>
          </div>
        ) : null}

        {!isOwner && !statusBadge ? (
          <FavoriteButton
            productId={product.id}
            initialFavorited={favorited}
            onChange={onFavoriteChange}
            className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-md shadow-sm"
            iconClassName="size-4"
          />
        ) : null}
      </div>
    </article>
  );
}
