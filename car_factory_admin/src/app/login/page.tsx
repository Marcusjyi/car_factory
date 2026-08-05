"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const { user, adminUser, loading, login, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && adminUser) {
      router.replace("/dashboard");
    }
  }, [loading, user, adminUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "로그인에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4]">
        <p className="text-sm text-[#6B7280]">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
            CARFACTORY
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#464646]">
            관리자 로그인
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {(localError || error) && (
            <p className="text-sm text-red-600">{localError || error}</p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
