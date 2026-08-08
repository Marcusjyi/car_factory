"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  UserCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "회원", icon: Users },
  { href: "/dashboard/products", label: "상품", icon: Package },
  { href: "/dashboard/orders", label: "주문", icon: ShoppingBag },
  { href: "/dashboard/partners", label: "파트너스", icon: Store },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { adminUser, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#E0E0E0] bg-[#F4F4F4]">
      <div className="border-b border-[#E0E0E0] px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
          CARFACTORY
        </p>
        <h2 className="mt-1 text-xl font-bold text-[#464646]">관리자</h2>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white text-[#464646] shadow-sm"
                  : "text-[#6B7280] hover:bg-white/70",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#E0E0E0] p-4">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-[#9CA3AF]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#464646]">
              {adminUser?.displayName ?? "관리자"}
            </p>
            <p className="truncate text-xs text-[#9CA3AF]">{adminUser?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => logout()}>
          로그아웃
        </Button>
      </div>
    </aside>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="border-b border-[#E0E0E0] px-4 py-4 lg:hidden">
          <p className="text-sm font-semibold text-[#464646]">
            CARFACTORY 관리자
          </p>
        </div>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
