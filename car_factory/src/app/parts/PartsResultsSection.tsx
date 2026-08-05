"use client";

import { useState } from "react";
import { Grid3X3, LayoutList } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/mock-data";
import { PRODUCT_GRID_SIDEBAR_CLASS } from "@/lib/product-ui";
import { cn } from "@/lib/utils";

type PartsResultsSectionProps = {
  query: string;
  products: Product[];
};

export function PartsResultsSection({
  query,
  products,
}: PartsResultsSectionProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const totalCount = products.length;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-text">
          &apos;{query}&apos; 검색 결과{" "}
          <span className="text-primary">{totalCount}개</span>
        </h1>
        <div className="flex items-center gap-2">
          <select
            defaultValue="latest"
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text outline-none focus:border-primary"
            aria-label="정렬"
          >
            <option value="latest">최신순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="popular">인기순</option>
          </select>
          <div className="flex overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "flex size-9 items-center justify-center",
                view === "grid"
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-bg",
              )}
              aria-label="그리드 보기"
            >
              <Grid3X3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex size-9 items-center justify-center border-l border-border",
                view === "list"
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-bg",
              )}
              aria-label="리스트 보기"
            >
              <LayoutList className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl border border-border bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-text">검색 결과가 없습니다.</p>
          <p className="mt-1 text-xs text-text-secondary">
            다른 키워드로 다시 검색해 보세요.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            view === "grid" ? PRODUCT_GRID_SIDEBAR_CLASS : "flex flex-col gap-3",
          )}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
