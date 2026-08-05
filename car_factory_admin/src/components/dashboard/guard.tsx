"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardShell } from "@/components/dashboard/sidebar";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, adminUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !adminUser)) {
      router.replace("/login");
    }
  }, [loading, user, adminUser, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4]">
        <p className="text-sm text-[#6B7280]">로딩 중...</p>
      </div>
    );
  }

  if (!user || !adminUser) return null;

  return <DashboardShell>{children}</DashboardShell>;
}
