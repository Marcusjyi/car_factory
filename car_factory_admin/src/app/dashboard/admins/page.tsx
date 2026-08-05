"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import type { AdminUser } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";

export default function AdminsPage() {
  const { adminUser, getIdToken } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("인증 토큰이 없습니다.");
      const res = await fetch("/api/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => null)) as
        | AdminUser[]
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          (body && !Array.isArray(body) && body.error) ||
            "관리자 목록을 불러오지 못했습니다.",
        );
      }
      setAdmins(Array.isArray(body) ? body : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("인증 토큰이 없습니다.");
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, displayName }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(body?.error ?? "관리자 추가에 실패했습니다.");
      }
      setEmail("");
      setPassword("");
      setDisplayName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setSubmitting(false);
    }
  }

  const canCreate = adminUser?.role === "super_admin";

  return (
    <div>
      <PageHeader title="관리자" description="admins 계정" />
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {canCreate ? (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-[#222]">관리자 추가</h2>
          <form
            onSubmit={handleCreate}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              label="표시 이름"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <div className="flex items-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "추가 중..." : "추가"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">불러오는 중...</p>
        ) : admins.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">
            관리자가 없습니다.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-left">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">역할</th>
                <th className="px-4 py-3 font-medium">승인</th>
                <th className="px-4 py-3 font-medium">생성일</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.uid} className="border-b border-[#F0F0F0]">
                  <td className="px-4 py-3">{a.displayName || "-"}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">{a.role}</td>
                  <td className="px-4 py-3">
                    {a.isApproved ? "승인" : "대기"}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
