"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/firestore/client";
import type { DashboardStats } from "@/lib/types";

const emptyStats: DashboardStats = {
  totalUsers: 0,
  totalProducts: 0,
  sellingProducts: 0,
  todaySignups: 0,
  reservedProducts: 0,
  soldProducts: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getDashboardStats();
        if (!cancelled) setStats(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "통계를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "회원", value: stats.totalUsers, href: "/dashboard/users" },
    { label: "오늘 가입", value: stats.todaySignups, href: "/dashboard/users" },
    {
      label: "전체 상품",
      value: stats.totalProducts,
      href: "/dashboard/products",
    },
    {
      label: "판매중",
      value: stats.sellingProducts,
      href: "/dashboard/products",
    },
    {
      label: "예약중",
      value: stats.reservedProducts,
      href: "/dashboard/products",
    },
    {
      label: "판매완료",
      value: stats.soldProducts,
      href: "/dashboard/products",
    },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="CARFACTORY 플랫폼 전체 현황"
      />
      {loading ? (
        <p className="mb-4 text-sm text-[#9CA3AF]">불러오는 중...</p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition hover:shadow-md">
              <p className="text-sm text-[#6B7280]">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-[#222]">{card.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
