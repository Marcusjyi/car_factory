"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createPartner,
  getPartner,
  updatePartner,
} from "@/lib/firestore/client";
import {
  deletePartnerPhoto,
  uploadPartnerPhoto,
} from "@/lib/partners/photo-upload";
import type { PartnerInput } from "@/lib/types";

function splitCsv(value: string): string[] {
  return value
    .split(/[,，、·|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type FormState = {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  specialtiesText: string;
  specialtyLabel: string;
  badgesText: string;
  photoURL: string;
  photoPath: string;
  ratingAverage: string;
  ratingCount: string;
  displayOrder: string;
  isFeatured: boolean;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  id: "",
  name: "",
  region: "",
  address: "",
  phone: "",
  hours: "",
  description: "",
  specialtiesText: "",
  specialtyLabel: "",
  badgesText: "",
  photoURL: "",
  photoPath: "",
  ratingAverage: "0",
  ratingCount: "0",
  displayOrder: "0",
  isFeatured: false,
  isActive: true,
});

function toInput(form: FormState): PartnerInput {
  return {
    name: form.name.trim(),
    region: form.region.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    hours: form.hours.trim(),
    description: form.description.trim(),
    specialties: splitCsv(form.specialtiesText),
    specialtyLabel: form.specialtyLabel.trim(),
    badges: splitCsv(form.badgesText),
    photoURL: form.photoURL.trim(),
    photoPath: form.photoPath.trim() || undefined,
    ratingAverage: Number(form.ratingAverage) || 0,
    ratingCount: Number(form.ratingCount) || 0,
    displayOrder: Number(form.displayOrder) || 0,
    isFeatured: form.isFeatured,
    isActive: form.isActive,
  };
}

export function PartnerEditor({ partnerId }: { partnerId?: string }) {
  const router = useRouter();
  const isNew = !partnerId;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await getPartner(partnerId);
        if (!p) {
          if (!cancelled) setError("파트너를 찾을 수 없습니다.");
          return;
        }
        if (cancelled) return;
        setForm({
          id: p.id,
          name: p.name,
          region: p.region,
          address: p.address,
          phone: p.phone,
          hours: p.hours,
          description: p.description,
          specialtiesText: p.specialties.join(", "),
          specialtyLabel: p.specialtyLabel,
          badgesText: p.badges.join(", "),
          photoURL: p.photoURL,
          photoPath: p.photoPath ?? "",
          ratingAverage: String(p.ratingAverage ?? 0),
          ratingCount: String(p.ratingCount ?? 0),
          displayOrder: String(p.displayOrder ?? 0),
          isFeatured: p.isFeatured,
          isActive: p.isActive,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "불러오기에 실패했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onPickPhoto(file: File | null) {
    if (!file) return;
    const id = (partnerId || form.id).trim();
    if (!id) {
      setError("사진 업로드 전에 파트너 ID를 입력하세요.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const prevPath = form.photoPath;
      const { photoURL, photoPath } = await uploadPartnerPhoto(id, file);
      patch("photoURL", photoURL);
      patch("photoPath", photoPath);
      if (prevPath && prevPath !== photoPath) {
        await deletePartnerPhoto(prevPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = toInput(form);
      if (!input.name) throw new Error("지점명을 입력하세요.");
      if (!input.address) throw new Error("주소를 입력하세요.");

      if (isNew) {
        const id = form.id.trim();
        if (!/^[a-zA-Z0-9_-]{2,40}$/.test(id)) {
          throw new Error("ID는 영문·숫자·_- 2~40자여야 합니다. (예: g1)");
        }
        await createPartner(id, input);
        router.push(`/dashboard/partners/${id}`);
        return;
      }
      await updatePartner(partnerId!, input);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#9CA3AF]">불러오는 중…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "파트너 추가" : form.name || partnerId || "파트너"}
        description="사진·주소·전문분야·뱃지 등은 웹 장착 대행점(/installers)에 반영됩니다."
        action={
          <Link
            href="/dashboard/partners"
            className="text-sm font-medium text-[#6B7280] hover:text-[#464646]"
          >
            목록으로
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-[#464646]">기본 정보</h2>
          {isNew ? (
            <Input
              label="파트너 ID (URL용)"
              value={form.id}
              onChange={(e) => patch("id", e.target.value)}
              placeholder="예: g1, gimpo"
              required
            />
          ) : (
            <p className="text-sm text-[#6B7280]">
              ID: <span className="font-mono text-[#464646]">{partnerId}</span>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="지점명"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              required
            />
            <Input
              label="권역"
              value={form.region}
              onChange={(e) => patch("region", e.target.value)}
              placeholder="경기 김포"
            />
            <Input
              label="전화"
              value={form.phone}
              onChange={(e) => patch("phone", e.target.value)}
            />
            <Input
              label="영업시간"
              value={form.hours}
              onChange={(e) => patch("hours", e.target.value)}
            />
            <Input
              label="표시 순서"
              type="number"
              value={form.displayOrder}
              onChange={(e) => patch("displayOrder", e.target.value)}
            />
            <Input
              label="별점 평균"
              type="number"
              step="0.1"
              value={form.ratingAverage}
              onChange={(e) => patch("ratingAverage", e.target.value)}
            />
            <Input
              label="별점 수"
              type="number"
              value={form.ratingCount}
              onChange={(e) => patch("ratingCount", e.target.value)}
            />
          </div>
          <Input
            label="주소"
            value={form.address}
            onChange={(e) => patch("address", e.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-[#464646]">
              소개
            </label>
            <textarea
              className="min-h-[88px] w-full rounded-xl border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-[#464646]"
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-[#464646]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => patch("isActive", e.target.checked)}
              />
              공개 (웹 목록 노출)
            </label>
            <label className="flex items-center gap-2 text-sm text-[#464646]">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => patch("isFeatured", e.target.checked)}
              />
              앱 홈 카드 노출
            </label>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-[#464646]">
            전문분야 · 뱃지
          </h2>
          <Input
            label="전문분야 (쉼표 구분)"
            value={form.specialtiesText}
            onChange={(e) => patch("specialtiesText", e.target.value)}
            placeholder="엔진, 미션, 오버홀"
          />
          <Input
            label="앱 카드 전문 문구 (한 줄)"
            value={form.specialtyLabel}
            onChange={(e) => patch("specialtyLabel", e.target.value)}
            placeholder="수입차 엔진, 미션, 오버홀 전문"
          />
          <Input
            label="뱃지 (쉼표 구분)"
            value={form.badgesText}
            onChange={(e) => patch("badgesText", e.target.value)}
            placeholder="당일 예약 가능, 보증 서비스"
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-[#464646]">대표 사진</h2>
          {form.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.photoURL}
              alt=""
              className="h-40 w-40 rounded-xl object-cover bg-[#F0F0F0]"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-[#F0F0F0] text-xs text-[#9CA3AF]">
              사진 없음
            </div>
          )}
          <Input
            label="사진 URL (직접 입력 가능)"
            value={form.photoURL}
            onChange={(e) => patch("photoURL", e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-[#464646]">
              파일 업로드
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
            />
            {uploading ? (
              <p className="mt-1 text-xs text-[#9CA3AF]">업로드 중…</p>
            ) : null}
          </div>
        </Card>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? "저장 중…" : "저장"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/dashboard/partners")}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
