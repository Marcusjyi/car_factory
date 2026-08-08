"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { callSeedPartners } from "@/lib/firebase/config";
import { listPartners } from "@/lib/firestore/client";
import type { Partner } from "@/lib/types";

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setPartners(await listPartners());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "파트너 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) =>
      [p.name, p.region, p.address, p.id, ...p.specialties, ...p.badges]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [partners, query]);

  async function onSeed() {
    if (!confirm("기존 장착점 10곳을 partners에 시드(병합)할까요?")) return;
    setSeeding(true);
    setError(null);
    try {
      const res = await callSeedPartners();
      await reload();
      alert(`시드 완료: ${res.count}건`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시드 실패");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="파트너스"
        description="장착 대행점 사진·주소·전문분야·뱃지를 관리합니다. 노출은 웹·앱에 함께 적용됩니다."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={seeding}
              onClick={() => void onSeed()}
            >
              {seeding ? "시드 중…" : "초기 데이터 시드"}
            </Button>
            <Link
              href="/dashboard/partners/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#464646] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#333]"
            >
              파트너 추가
            </Link>
          </div>
        }
      />

      <Card className="p-4">
        <Input
          placeholder="지점명, 지역, 주소, 전문분야 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-medium">사진</th>
                <th className="px-4 py-3 font-medium">지점</th>
                <th className="px-4 py-3 font-medium">주소</th>
                <th className="px-4 py-3 font-medium">전문분야</th>
                <th className="px-4 py-3 font-medium">노출</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[#9CA3AF]"
                  >
                    불러오는 중…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[#9CA3AF]"
                  >
                    등록된 파트너가 없습니다. 「초기 데이터 시드」로 시작할 수
                    있습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3">
                      {p.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoURL}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover bg-[#F0F0F0]"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-[#F0F0F0]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/partners/${p.id}`}
                        className="font-medium text-[#464646] hover:underline"
                      >
                        {p.name || p.id}
                      </Link>
                      <p className="text-xs text-[#9CA3AF]">{p.region}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[#6B7280]">
                      {p.address || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {p.specialties.length
                        ? p.specialties.join(" · ")
                        : p.specialtyLabel || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <Badge variant="success">웹·앱</Badge>
                      ) : (
                        <Badge>비공개</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
