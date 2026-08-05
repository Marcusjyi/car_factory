"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { getUser, listProductsBySeller } from "@/lib/firestore/client";
import type { AppUser, Product } from "@/lib/types";
import { formatDateTime, formatPrice } from "@/lib/utils/format";

const STORE_URL =
  process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") ||
  "https://carfactory.kr";

function statusLabel(status: string) {
  switch (status) {
    case "selling":
      return "판매중";
    case "reserved":
      return "예약중";
    case "sold":
      return "판매완료";
    case "hidden":
      return "숨김";
    case "draft":
      return "임시저장";
    case "blocked":
      return "차단";
    default:
      return status;
  }
}

function Row({ label, value, trailing }: {
  label: string;
  value?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 border-b border-[#F0F0F0] py-3 text-sm last:border-b-0">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-1 break-all text-[#222]">
        <span className="min-w-0">{empty ? "-" : value}</span>
        {trailing}
      </dd>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
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
      aria-label="복사"
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F4F4F4] hover:text-[#464646]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export default function UserDetailPage() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const [user, setUser] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [nextUser, nextProducts] = await Promise.all([
          getUser(uid),
          listProductsBySeller(uid),
        ]);
        if (!cancelled) {
          if (!nextUser) setError("회원을 찾을 수 없습니다.");
          else setUser(nextUser);
          setProducts(nextProducts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "회원 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const productSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={user?.displayName || user?.name || "회원 상세"}
        description={loading ? "불러오는 중..." : undefined}
        action={
          <Link href="/dashboard/users" className="text-sm text-[#6B7280] underline">
            목록으로
          </Link>
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {user ? (
        <>
          <Card>
            <h2 className="mb-2 text-lg font-semibold text-[#222]">기본 정보</h2>
            <dl>
              <Row label="실명" value={user.name} />
              <Row label="이메일" value={user.email} />
              <Row label="전화" value={user.phoneNumber} />
              <Row label="지역" value={user.defaultRegion} />
              <Row label="주소" value={user.address1} />
              <Row label="상태" value={<StatusBadge status={user.status} />} />
              <Row
                label="UID"
                value={<span className="font-mono text-xs">{user.uid}</span>}
                trailing={<CopyButton value={user.uid} />}
              />
              <Row label="구매" value={user.purchaseCount ?? 0} />
              <Row label="판매" value={user.saleCount ?? 0} />
              <Row
                label="평점"
                value={
                  user.ratingCount
                    ? `${user.ratingAverage?.toFixed(1)} (${user.ratingCount})`
                    : "-"
                }
              />
              <Row
                label="최근 로그인"
                value={formatDateTime(user.lastLoginAt)}
              />
              <Row label="가입일" value={formatDateTime(user.createdAt)} />
            </dl>
          </Card>

          <Card className="overflow-x-auto p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E0E0E0] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#222]">판매 상품</h2>
              <p className="text-sm text-[#6B7280]">
                총 {products.length}건
                {Object.keys(productSummary).length
                  ? ` · ${Object.entries(productSummary)
                      .map(([k, v]) => `${statusLabel(k)} ${v}`)
                      .join(" · ")}`
                  : ""}
              </p>
            </div>
            {products.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#9CA3AF]">
                등록한 상품이 없습니다.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-left">
                    <th className="px-4 py-3 font-medium">상품</th>
                    <th className="px-4 py-3 font-medium">부품</th>
                    <th className="px-4 py-3 font-medium">가격</th>
                    <th className="px-4 py-3 font-medium">상태</th>
                    <th className="px-4 py-3 font-medium">지역</th>
                    <th className="px-4 py-3 font-medium">등록일</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-[#F0F0F0]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnailURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.thumbnailURL}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover bg-[#F4F4F4]"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-[#F4F4F4]" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{p.title || "-"}</p>
                            <p className="font-mono text-xs text-[#9CA3AF]">
                              {p.listingNumber ?? p.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.partName ?? "-"}</td>
                      <td className="px-4 py-3">{formatPrice(p.price)}원</td>
                      <td className="px-4 py-3">{statusLabel(p.status)}</td>
                      <td className="px-4 py-3">{p.region ?? "-"}</td>
                      <td className="px-4 py-3">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`${STORE_URL}/products/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#464646] underline"
                        >
                          스토어
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
