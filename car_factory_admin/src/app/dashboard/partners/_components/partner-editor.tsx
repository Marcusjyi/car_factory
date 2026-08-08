"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  createPartner,
  getPartner,
  updatePartner,
} from "@/lib/firestore/client";
import {
  deletePartnerPhoto,
  uploadPartnerPhoto,
} from "@/lib/partners/photo-upload";
import { PartnerHoursField } from "./hours-wheels";
import {
  DEFAULT_HOURS_STATE,
  PARTNER_BADGE_OPTIONS,
  PARTNER_SPECIALTY_OPTIONS,
  formatPartnerHours,
  parsePartnerHours,
  type HoursState,
} from "@/lib/partners/options";
import type { PartnerWriteInput } from "@/lib/types";

type FormState = {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  hours: HoursState;
  description: string;
  specialties: string[];
  badges: string[];
  photoURL: string;
  photoPath: string;
};

const emptyForm = (): FormState => ({
  id: "",
  name: "",
  region: "",
  address: "",
  phone: "",
  hours: {
    weekdayOpen: { ...DEFAULT_HOURS_STATE.weekdayOpen },
    weekdayClose: { ...DEFAULT_HOURS_STATE.weekdayClose },
    holidayMode: DEFAULT_HOURS_STATE.holidayMode,
    holidayOpen: { ...DEFAULT_HOURS_STATE.holidayOpen },
    holidayClose: { ...DEFAULT_HOURS_STATE.holidayClose },
  },
  description: "",
  specialties: [],
  badges: [],
  photoURL: "",
  photoPath: "",
});

function toWriteInput(form: FormState): PartnerWriteInput {
  return {
    name: form.name.trim(),
    region: form.region.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    hours: formatPartnerHours(form.hours),
    description: form.description.trim(),
    specialties: form.specialties,
    specialtyLabel: form.specialties.join(", "),
    badges: form.badges,
    photoURL: form.photoURL.trim(),
    photoPath: form.photoPath.trim() || undefined,
    isActive: true,
  };
}

function toggleValue(list: string[], value: string, max?: number): string[] {
  if (list.includes(value)) {
    return list.filter((v) => v !== value);
  }
  if (max != null && list.length >= max) {
    return list;
  }
  return [...list, value];
}

function ChipSelect({
  options,
  values,
  onChange,
  max,
}: {
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const extras = values.filter((v) => !options.includes(v));
  const all = [...options, ...extras];
  const atMax = max != null && values.length >= max;

  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((opt) => {
        const selected = values.includes(opt);
        const disabled = !selected && atMax;
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(toggleValue(values, opt, max))}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold transition",
              selected
                ? "bg-[#464646] text-white"
                : disabled
                  ? "cursor-not-allowed bg-[#F5F5F5] text-[#C0C0C0]"
                  : "bg-[#F0F0F0] text-[#6B7280] hover:bg-[#E4E4E4]",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function PartnerEditor({ partnerId }: { partnerId?: string }) {
  const router = useRouter();
  const isNew = !partnerId;
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);

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
          hours: parsePartnerHours(p.hours),
          description: p.description,
          specialties: p.specialties.slice(0, 5),
          badges: p.badges.slice(0, 3),
          photoURL: p.photoURL,
          photoPath: p.photoPath ?? "",
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
      setError("사진 업로드 전에 지점 ID를 입력하세요.");
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
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = toWriteInput(form);
      if (!input.name) throw new Error("지점명을 입력하세요.");
      if (!input.address) throw new Error("주소를 입력하세요.");
      if (input.specialties.length > 5) {
        throw new Error("전문분야는 최대 5개까지 선택할 수 있습니다.");
      }

      if (isNew) {
        const id = form.id.trim();
        if (!/^[a-zA-Z0-9_-]{2,40}$/.test(id)) {
          throw new Error("ID는 영문·숫자·_- 2~40자여야 합니다. (예: g1)");
        }
        await createPartner(id, input);
      } else {
        await updatePartner(partnerId!, input);
      }
      setSavedOpen(true);
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
    <div className="space-y-5">
      <PageHeader
        title={isNew ? "지점 추가" : form.name || partnerId || "지점"}
        action={
          <Link
            href="/dashboard/partners"
            className="text-sm font-medium text-[#6B7280] hover:text-[#464646]"
          >
            목록으로
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[#464646]">기본 정보</h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {isNew ? (
              <Input
                label="지점 ID"
                value={form.id}
                onChange={(e) => patch("id", e.target.value)}
                placeholder="g1, gimpo"
                required
              />
            ) : (
              <div>
                <p className="mb-1.5 text-sm font-medium text-[#464646]">ID</p>
                <p className="flex h-[42px] items-center rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] px-3 font-mono text-sm text-[#6B7280]">
                  {partnerId}
                </p>
              </div>
            )}
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
              placeholder="031-000-0000"
            />
          </div>

          <PartnerHoursField
            value={form.hours}
            onChange={(hours) => patch("hours", hours)}
          />

          <Input
            label="주소"
            value={form.address}
            onChange={(e) => patch("address", e.target.value)}
            required
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#464646]">
              소개
            </label>
            <textarea
              className="min-h-[88px] w-full rounded-xl border border-[#E0E0E0] px-3 py-2.5 text-sm outline-none focus:border-[#464646]"
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
              placeholder="짧은 소개"
            />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[#464646]">대표 사진</h2>
          <div className="flex flex-wrap items-start gap-4">
            {form.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photoURL}
                alt=""
                className="h-28 w-28 shrink-0 rounded-xl object-cover bg-[#F0F0F0]"
              />
            ) : (
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5] text-[11px] text-[#9CA3AF]">
                사진 없음
              </div>
            )}
            <div className="space-y-2">
              <input
                id={fileInputId}
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="secondary"
                className="py-2 text-xs"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "업로드…" : "사진 업로드"}
              </Button>
              {form.photoURL ? (
                <button
                  type="button"
                  disabled={uploading}
                  className="block text-[11px] text-[#9CA3AF] hover:text-[#6B7280]"
                  onClick={() => {
                    patch("photoURL", "");
                    patch("photoPath", "");
                  }}
                >
                  사진 제거
                </button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#464646]">전문분야</h2>
            <p className="text-xs text-[#9CA3AF]">
              {form.specialties.length}/5
            </p>
          </div>
          <ChipSelect
            options={PARTNER_SPECIALTY_OPTIONS}
            values={form.specialties}
            max={5}
            onChange={(specialties) => patch("specialties", specialties)}
          />
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#464646]">뱃지</h2>
            <p className="text-xs text-[#9CA3AF]">{form.badges.length}/3</p>
          </div>
          <ChipSelect
            options={PARTNER_BADGE_OPTIONS}
            values={form.badges}
            max={3}
            onChange={(badges) => patch("badges", badges)}
          />
        </Card>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/dashboard/partners")}
          >
            취소
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </div>
      </form>

      {savedOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-black/35"
            onClick={() => router.push("/dashboard/partners")}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-saved-title"
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id="partner-saved-title"
              className="text-base font-semibold text-[#464646]"
            >
              저장되었습니다
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              지점 정보가 웹·앱에 반영됩니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSavedOpen(false);
                  if (isNew) {
                    router.replace(`/dashboard/partners/${form.id.trim()}`);
                  }
                }}
              >
                계속 편집
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/dashboard/partners")}
              >
                목록으로
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
