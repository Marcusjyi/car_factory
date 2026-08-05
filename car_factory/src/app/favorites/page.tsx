"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyPageSidebar } from "@/components/layout/MyPageSidebar";
import { ProductCard } from "@/components/product/ProductCard";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  listFavoriteIds,
  removeFavorite,
} from "@/features/favorites/favorites-repository";
import { toCardProduct } from "@/features/products/product-mappers";
import { getProductRepository } from "@/features/products/product-repository";
import { PRODUCT_GRID_SIDEBAR_CLASS } from "@/lib/product-ui";
import type { Product } from "@/lib/mock-data";

export default function FavoritesPage() {
  const router = useRouter();
  const { status, firebaseUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (status === "loading") return;
    if (status !== "authenticated" || !firebaseUser) {
      setLoading(false);
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ids = await listFavoriteIds(firebaseUser.uid);
      const repo = getProductRepository();
      const next: Product[] = [];
      for (const id of ids) {
        try {
          const dto = await repo.getPublicProduct(id);
          if (dto) next.push(toCardProduct(dto));
          else await removeFavorite(firebaseUser.uid, id);
        } catch {
          // skip
        }
      }
      setProducts(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "찜목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/favorites");
      return;
    }
    void load();
  }, [load, router, status]);

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:flex-row md:gap-8">
        <MyPageSidebar activeHref="/favorites" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-text">찜목록</h1>
          <p className="mt-1 text-sm text-text-secondary">
            관심 있는 부품을 모아보고 관리할 수 있습니다.
          </p>

          {status === "loading" || loading ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-[12px] border border-border bg-white py-16 text-sm text-text-muted">
              <Loader2 className="size-4 animate-spin" />
              찜목록을 불러오는 중…
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-text-secondary">
                찜한 상품{" "}
                <span className="font-bold text-text">{products.length}</span>개
              </p>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {products.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-border bg-white p-10 text-center">
                  <p className="text-sm text-text-secondary">
                    찜한 상품이 없습니다.
                  </p>
                  <Link
                    href="/parts"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
                  >
                    부품 둘러보기
                  </Link>
                </div>
              ) : (
                <div className={PRODUCT_GRID_SIDEBAR_CLASS}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      favorited
                      showCartHover
                      onFavoriteChange={(favorited) => {
                        if (!favorited) {
                          setProducts((prev) =>
                            prev.filter((p) => p.id !== product.id),
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
