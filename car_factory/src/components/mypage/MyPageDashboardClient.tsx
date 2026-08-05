"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  History,
  Heart,
  User,
  Headset,
  CircleCheck,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { countFavorites } from "@/features/favorites/favorites-repository";
import { getProductRepository } from "@/features/products/product-repository";
import { MYPAGE_QUICK_LINKS } from "@/lib/constants";
import type { ProductPublicDto } from "@/types/product";

const QUICK_ICONS: Record<string, LucideIcon> = {
  store: Store,
  "circle-check": CircleCheck,
  history: History,
  heart: Heart,
  user: User,
  headset: Headset,
};

function formatJoinedAt(value: unknown): string {
  if (!value) return "";
  let date: Date | null = null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    date = (value as { toDate: () => Date }).toDate();
  }
  if (!date) return "";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function initialFromName(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : "?";
}

export function MyPageDashboardClient() {
  const router = useRouter();
  const { status, user, firebaseUser } = useAuth();
  const [products, setProducts] = useState<ProductPublicDto[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    if (status === "loading") return;
    if (status !== "authenticated" || !firebaseUser) {
      setLoadingStats(false);
      setProducts([]);
      setFavoriteCount(0);
      return;
    }
    setLoadingStats(true);
    try {
      const [owned, favCount] = await Promise.all([
        getProductRepository().listOwnedProducts(firebaseUser.uid),
        countFavorites(firebaseUser.uid),
      ]);
      setProducts(owned);
      setFavoriteCount(favCount);
    } catch {
      setProducts([]);
      setFavoriteCount(0);
    } finally {
      setLoadingStats(false);
    }
  }, [firebaseUser, status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/mypage");
      return;
    }
    void loadStats();
  }, [loadStats, router, status]);

  const displayName =
    user?.displayName?.trim() ||
    firebaseUser?.displayName?.trim() ||
    "회원";
  const photoURL = user?.photoURL || firebaseUser?.photoURL || null;
  const joinedAt = formatJoinedAt(user?.createdAt);

  const sellingCount = useMemo(
    () =>
      products.filter(
        (p) => p.status === "selling" || p.status === "reserved",
      ).length,
    [products],
  );
  const soldCount = useMemo(
    () => products.filter((p) => p.status === "sold").length,
    [products],
  );

  const quickLinks = [
    {
      href: "/mypage/products",
      label: "판매 중",
      icon: "store",
      count: sellingCount,
    },
    {
      href: "/mypage/products",
      label: "판매 완료",
      icon: "circle-check",
      count: soldCount,
    },
    {
      href: "/favorites",
      label: "찜목록",
      icon: "heart",
      count: favoriteCount,
    },
    ...MYPAGE_QUICK_LINKS.map((item) => ({
      ...item,
      count: null as number | null,
    })),
  ];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[12px] border border-border bg-white py-20 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" />
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-[12px] border border-border bg-white p-5">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xl font-bold text-primary">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoURL}
              alt={displayName}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initialFromName(displayName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-text">{displayName}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {joinedAt ? `가입일 ${joinedAt}` : "카팩토리 회원"}
            {user?.defaultRegion ? ` · ${user.defaultRegion}` : ""}
          </p>
        </div>
      </section>

      <section className="rounded-[12px] border border-border bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-text">바로가기</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = QUICK_ICONS[item.icon] ?? User;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-4 text-center transition hover:border-primary hover:bg-primary-light"
              >
                <Icon className="size-5 text-primary" />
                {item.count != null ? (
                  <span className="text-lg font-extrabold text-text">
                    {loadingStats ? "…" : item.count}
                  </span>
                ) : null}
                <span className="text-xs font-medium text-text">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
