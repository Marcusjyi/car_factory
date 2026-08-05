"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { listUsers } from "@/lib/firestore/client";
import type { AppUser } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

function matchesQuery(user: AppUser, raw: string) {
  const q = raw.trim().toLowerCase().replace(/-/g, "");
  if (!q) return true;
  const haystack = [
    user.displayName,
    user.name,
    user.email,
    user.phoneNumber,
    user.defaultRegion,
    user.uid,
    user.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/-/g, "");
  return haystack.includes(q);
}

function CopyUidButton({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "복사됨" : "UID 복사"}
      aria-label="UID 복사"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F4F4F4] hover:text-[#464646]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/** mechanic_admin 목록 테이블 패턴 준수 (참고만, mechanic 파일 수정 금지) */
export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listUsers();
        if (!cancelled) setUsers(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "회원 목록을 불러오지 못했습니다.",
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

  const filtered = useMemo(
    () => users.filter((u) => matchesQuery(u, query)),
    [users, query],
  );

  return (
    <div>
      <PageHeader
        title="회원"
        description={
          loading
            ? "가입 회원 목록"
            : query.trim()
              ? `${filtered.length}명 / 전체 ${users.length}명`
              : `총 ${users.length}명`
        }
        action={
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="닉네임, 실명, 이메일, 전화, UID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        }
      />

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">불러오는 중...</p>
        ) : null}
        {error ? (
          <p className="p-8 text-center text-sm text-red-600">{error}</p>
        ) : null}
        {!loading && !error && users.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">회원이 없습니다.</p>
        ) : null}
        {!loading && !error && users.length > 0 && filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">
            검색 결과가 없습니다.
          </p>
        ) : null}
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-left">
                <th className="px-4 py-3 font-medium">닉네임</th>
                <th className="px-4 py-3 font-medium">실명</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">전화</th>
                <th className="px-4 py-3 font-medium">지역</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium">UID</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} className="border-b border-[#F0F0F0]">
                  <td className="px-4 py-3">{u.displayName ?? "-"}</td>
                  <td className="px-4 py-3">{u.name ?? "-"}</td>
                  <td className="px-4 py-3">{u.email ?? "-"}</td>
                  <td className="px-4 py-3">{u.phoneNumber ?? "-"}</td>
                  <td className="px-4 py-3">{u.defaultRegion ?? "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{u.uid}</span>
                      <CopyUidButton uid={u.uid} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/users/${u.uid}`}
                      className="text-[#464646] underline"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Card>
    </div>
  );
}
