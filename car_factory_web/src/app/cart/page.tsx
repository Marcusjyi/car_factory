"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  listCartItems,
  removeCartItem,
  removeCartItems,
  updateCartItemQuantity,
} from "@/features/cart/cart-repository";
import { formatPrice } from "@/lib/utils";
import type { CartListItem } from "@/types/cart";

export default function CartPage() {
  const router = useRouter();
  const { status, firebaseUser } = useAuth();
  const [items, setItems] = useState<CartListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const list = await listCartItems(firebaseUser.uid);
      setItems((prev) => {
        const selectedMap = new Map(prev.map((p) => [p.productId, p.selected]));
        return list.map((item) => ({
          ...item,
          selected: selectedMap.get(item.productId) ?? true,
        }));
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "장바구니를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/cart");
      return;
    }
    void load();
  }, [load, router, status]);

  const allSelected =
    items.length > 0 &&
    items.filter((i) => !i.unavailable).every((item) => item.selected);
  const selectedItems = items.filter(
    (item) => item.selected && !item.unavailable,
  );

  const productTotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );
  const shippingTotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + (item.shippingFee ?? 0), 0),
    [selectedItems],
  );
  const orderTotal = productTotal + shippingTotal;

  const toggleAll = () => {
    const next = !allSelected;
    setItems((prev) =>
      prev.map((item) =>
        item.unavailable ? item : { ...item, selected: next },
      ),
    );
  };

  const toggleItem = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  async function onQuantityChange(productId: string, delta: number) {
    if (!firebaseUser) return;
    const current = items.find((i) => i.productId === productId);
    if (!current) return;
    const quantity = Math.max(1, current.quantity + delta);
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
    try {
      await updateCartItemQuantity(firebaseUser.uid, productId, quantity);
    } catch (e) {
      setError(e instanceof Error ? e.message : "수량 변경에 실패했습니다.");
      void load();
    }
  }

  async function onRemove(productId: string) {
    if (!firebaseUser) return;
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    try {
      await removeCartItem(firebaseUser.uid, productId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
      void load();
    }
  }

  async function onRemoveSelected() {
    if (!firebaseUser) return;
    const ids = selectedItems.map((i) => i.productId);
    if (ids.length === 0) return;
    setItems((prev) => prev.filter((item) => !item.selected));
    try {
      await removeCartItems(firebaseUser.uid, ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : "선택 삭제에 실패했습니다.");
      void load();
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader showCategoryNav cartCount={items.length} />

      <Breadcrumbs
        items={[{ label: "홈", href: "/" }, { label: "장바구니" }]}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-10">
        <div className="mb-6 flex items-baseline gap-2">
          <h1 className="text-2xl font-extrabold text-text">장바구니</h1>
          <span className="text-sm font-semibold text-primary">
            {items.length}개 상품
          </span>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-[12px] border border-border bg-white">
              <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={items.length === 0}
                    className="size-4 accent-primary"
                  />
                  <span className="font-medium text-text">전체 선택</span>
                </label>
                <button
                  type="button"
                  onClick={() => void onRemoveSelected()}
                  disabled={selectedItems.length === 0}
                  className="text-text-secondary hover:text-primary disabled:opacity-40"
                >
                  선택 삭제
                </button>
              </div>

              <div className="hidden grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 border-b border-border bg-bg px-4 py-2.5 text-xs font-semibold text-text-secondary md:grid">
                <span className="w-5" />
                <span>상품 정보</span>
                <span className="w-24 text-center">수량</span>
                <span className="w-24 text-right">상품 금액</span>
                <span className="w-24 text-right">배송비</span>
                <span className="w-28 text-right">합계</span>
                <span className="w-8" />
              </div>

              {status === "loading" || loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  불러오는 중…
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <CartRow
                      key={item.productId}
                      item={item}
                      onToggle={() => toggleItem(item.productId)}
                      onQuantityChange={(delta) =>
                        void onQuantityChange(item.productId, delta)
                      }
                      onRemove={() => void onRemove(item.productId)}
                    />
                  ))}

                  {items.length === 0 ? (
                    <div className="px-4 py-16 text-center text-sm text-text-secondary">
                      장바구니에 담긴 상품이 없습니다.
                      <div className="mt-4">
                        <Link
                          href="/parts"
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          부품 둘러보기
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>

          <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[300px]">
            <div className="rounded-[12px] border border-border bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-text">주문 금액</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <dt>상품 금액</dt>
                  <dd>{formatPrice(productTotal)}</dd>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <dt>배송비</dt>
                  <dd>
                    {shippingTotal === 0 && selectedItems.length === 0
                      ? formatPrice(0)
                      : formatPrice(shippingTotal)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-text">
                  <dt>총 결제 금액</dt>
                  <dd className="text-primary">{formatPrice(orderTotal)}</dd>
                </div>
              </dl>

              {items.length === 0 || selectedItems.length === 0 ? (
                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-primary/40 text-sm font-bold text-white"
                >
                  채팅하기
                </button>
              ) : selectedItems.length === 1 ? (
                <Link
                  href={`/parts/${selectedItems[0].productId}`}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark"
                >
                  상품에서 채팅하기
                </Link>
              ) : (
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    disabled
                    className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-primary/40 text-sm font-bold text-white"
                  >
                    채팅하기
                  </button>
                  <p className="text-center text-xs text-amber-700">
                    직거래는 한 상품씩 채팅으로 진행합니다. 상품을 하나만
                    선택해 주세요.
                  </p>
                </div>
              )}

              <p className="mt-4 text-center text-xs leading-relaxed text-text-muted">
                구매 의사·일정은 채팅에서 합의하고,
                <br />
                판매자가 예약·판매완료를 처리합니다
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function CartRow({
  item,
  onToggle,
  onQuantityChange,
  onRemove,
}: {
  item: CartListItem;
  onToggle: () => void;
  onQuantityChange: (delta: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = item.price * item.quantity + item.shippingFee;

  return (
    <div className="grid gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] md:items-center">
      <label className="flex items-start pt-1 md:items-center">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={onToggle}
          disabled={item.unavailable}
          className="size-4 accent-primary"
        />
      </label>

      <div className="flex min-w-0 gap-3">
        <Link
          href={`/parts/${item.productId}`}
          className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100"
        >
          {item.thumbnailURL ? (
            <Image
              src={item.thumbnailURL}
              alt={item.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/parts/${item.productId}`}
            className="line-clamp-2 text-sm font-medium text-text hover:text-primary"
          >
            {item.title}
          </Link>
          {(item.yearRange || item.conditionDescription) && (
            <p className="text-xs text-text-muted">
              {[item.yearRange, item.conditionDescription]
                .filter(Boolean)
                .join(" | ")}
            </p>
          )}
          {item.sellerDisplayName ? (
            <p className="text-xs text-text-secondary">
              판매자 {item.sellerDisplayName}
            </p>
          ) : null}
          {item.unavailable ? (
            <p className="text-xs font-medium text-red-600">
              판매 중이 아닌 상품입니다
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-center md:w-24">
        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => onQuantityChange(-1)}
            className="flex size-8 items-center justify-center text-text-secondary hover:bg-bg"
            aria-label="수량 감소"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(1)}
            className="flex size-8 items-center justify-center text-text-secondary hover:bg-bg"
            aria-label="수량 증가"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex justify-between text-sm text-text md:block md:w-24 md:text-right">
        <span className="text-text-secondary md:hidden">상품 금액</span>
        <span>{formatPrice(item.price)}</span>
      </div>

      <div className="flex justify-between text-sm text-text md:block md:w-24 md:text-right">
        <span className="text-text-secondary md:hidden">배송비</span>
        <span>
          {item.shippingFee === 0 ? "무료" : formatPrice(item.shippingFee)}
        </span>
      </div>

      <div className="flex justify-between text-sm font-bold text-primary md:block md:w-28 md:text-right">
        <span className="font-medium text-text-secondary md:hidden">합계</span>
        <span>{formatPrice(lineTotal)}</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex size-8 items-center justify-center self-start text-text-muted hover:text-red-500 md:self-center"
        aria-label="삭제"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
