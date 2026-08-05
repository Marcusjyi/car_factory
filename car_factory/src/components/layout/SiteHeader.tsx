"use client";

import Link from "next/link";
import {
  Bell,
  PackagePlus,
  Search,
  ShoppingCart,
  Menu,
  Home,
} from "lucide-react";
import { HeaderAuthLinks } from "@/components/auth/HeaderAuthLinks";
import { useCartCount } from "@/features/cart/use-cart-count";
import { useChatUnreadCount } from "@/features/chat/use-chat-unread-count";
import { CATEGORY_GROUPS, SITE_NAME, SITE_NAME_KO } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  searchPlaceholder?: string;
  searchValue?: string;
  showCategoryNav?: boolean;
  cartCount?: number;
  className?: string;
};

export function SiteHeader({
  searchPlaceholder = "부품명, 차종, 부품번호를 검색해보세요",
  searchValue,
  showCategoryNav = false,
  cartCount,
  className,
}: SiteHeaderProps) {
  const liveCartCount = useCartCount(0);
  const badgeCount = cartCount ?? liveCartCount;
  const chatUnreadCount = useChatUnreadCount();
  return (
    <header className={cn("bg-white", className)}>
      <div className="border-b border-border">
        <div className="mx-auto flex h-9 max-w-[1200px] items-center px-4">
          <HeaderAuthLinks />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-3 md:py-4">
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/" className="shrink-0 leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-primary md:text-[22px]">
              {SITE_NAME}
            </span>
            <span className="hidden text-sm font-medium text-primary-soft sm:block">
              {SITE_NAME_KO}
            </span>
          </Link>

          <form action="/parts" className="relative hidden min-w-0 flex-1 md:block">
            <input
              name="q"
              defaultValue={searchValue}
              placeholder={searchPlaceholder}
              className="h-12 w-full rounded-full border border-border-strong bg-white px-5 pr-12 text-sm outline-none transition focus:border-primary"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
              aria-label="검색"
            >
              <Search className="size-5" />
            </button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-5">
            <HeaderIcon
              href="/sell"
              icon={<PackagePlus className="size-5 md:size-6" />}
              label="판매하기"
            />
            <HeaderIcon
              href="/chat"
              icon={<Bell className="size-5 md:size-6" />}
              label="알림"
              badge={chatUnreadCount}
            />
            <HeaderIcon
              href="/cart"
              icon={<ShoppingCart className="size-5 md:size-6" />}
              label="장바구니"
              badge={badgeCount}
            />
          </div>
        </div>

        <form action="/parts" className="relative mt-3 md:hidden">
          <input
            name="q"
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-full border border-border-strong bg-white px-4 pr-11 text-sm outline-none transition focus:border-primary"
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-label="검색"
          >
            <Search className="size-5" />
          </button>
        </form>
      </div>

      {showCategoryNav ? (
        <div className="border-y border-border">
          <div className="mx-auto flex max-w-[1200px] items-center gap-4 overflow-x-auto px-4 py-2.5 text-sm md:gap-5 md:py-3">
            <Link
              href="/parts"
              className="flex shrink-0 items-center gap-1.5 font-semibold text-text"
            >
              <Menu className="size-4" />
              전체 카테고리
            </Link>
            {CATEGORY_GROUPS.map((c) => (
              <Link
                key={c.id}
                href={`/parts?category=${c.id}`}
                className="shrink-0 text-text-secondary hover:text-primary"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function HeaderIcon({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-0.5 text-text hover:text-primary"
    >
      <span className="relative">
        {icon}
        {badge != null && badge > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="hidden text-[11px] text-text-secondary md:block">
        {label}
      </span>
    </Link>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="mx-auto flex max-w-[1200px] items-center gap-1.5 px-4 py-3 text-xs text-text-secondary">
      <Home className="size-3.5" />
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          <span className="text-border-strong">›</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="text-text">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
