"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { useAuth } from "@/features/auth/AuthProvider";
import { toCardProduct } from "@/features/products/product-mappers";
import { getProductRepository } from "@/features/products/product-repository";
import { PRODUCT_GRID_SIDEBAR_CLASS } from "@/lib/product-ui";
import type { Product } from "@/lib/mock-data";
import type { ProductPublicDto } from "@/types/product";

export function MyShopProductsClient() {
  const router = useRouter();
  const { firebaseUser, status } = useAuth();
  const [items, setItems] = useState<ProductPublicDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (status === "loading") return;
    if (status !== "authenticated" || !firebaseUser) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getProductRepository().listOwnedProducts(
        firebaseUser.uid,
      );
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(product: ProductPublicDto) {
    if (!firebaseUser) return;
    if (product.status === "reserved") {
      setError("예약 중인 상품은 예약을 취소한 뒤 삭제할 수 있습니다.");
      return;
    }
    const ok = window.confirm(
      `"${product.partName || product.title}" 상품을 삭제할까요?\n삭제 후 목록에서 보이지 않습니다.`,
    );
    if (!ok) return;
    setBusyId(product.id);
    setError(null);
    try {
      await getProductRepository().deleteOwnedProduct(
        product.id,
        firebaseUser.uid,
      );
      setItems((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 rounded-[12px] border border-border bg-white py-16 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" />
        상품을 불러오는 중…
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mt-6 rounded-[12px] border border-dashed border-border bg-white p-10 text-center">
        <p className="text-sm text-text-secondary">
          내 상점을 관리하려면 로그인이 필요합니다.
        </p>
        <Link
          href="/login?next=/mypage/products"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          등록 상품 <span className="font-bold text-text">{items.length}</span>개
        </p>
        <Link
          href="/sell"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-bold text-white hover:bg-primary-dark"
        >
          <PackagePlus className="size-4" />
          새 상품 등록
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm text-text-secondary">
            아직 등록한 상품이 없습니다.
          </p>
          <Link
            href="/sell"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
          >
            첫 상품 등록하기
          </Link>
        </div>
      ) : (
        <div className={PRODUCT_GRID_SIDEBAR_CLASS}>
          {items.map((dto) => {
            const card: Product = toCardProduct(dto);
            const canEdit =
              dto.status === "draft" || dto.status === "selling";
            const canDelete = dto.status !== "reserved";

            return (
              <ProductCard
                key={dto.id}
                product={card}
                ownerActions={{
                  canEdit,
                  canMarkSold: false,
                  canDelete,
                  busy: busyId === dto.id,
                  onEdit: () =>
                    router.push(`/mypage/products/${dto.id}/edit`),
                  onDelete: () => void onDelete(dto),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
