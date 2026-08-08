"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
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
import type { PartnerWriteInput } from "@/lib/types";

type FormState = {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  specialties: string[];
  specialtyLabel: string;
  badges: string[];
  photoURL: string;
  photoPath: string;
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
  specialties: [],
  specialtyLabel: "",
  badges: [],
  photoURL: "",
  photoPath: "",
  isActive: true,
});

function toWriteInput(form: FormState): PartnerWriteInput {
  return {
    name: form.name.trim(),
    region: form.region.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    hours: form.hours.trim(),
    description: form.description.trim(),
    specialties: form.specialties,
    specialtyLabel: form.specialtyLabel.trim(),
    badges: form.badges,
    photoURL: form.photoURL.trim(),
    photoPath: form.photoPath.trim() || undefined,
    isActive: form.isActive,
  };
}

function TagListEditor({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const t = draft.trim();
    if (!t) return;
    if (values.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...values, t]);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-[#464646]">{label}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.length === 0 ? (
          <span className="text-xs text-[#9CA3AF]">아직 없음</span>
        ) : (
          values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="inline-flex items-center gap-1 rounded-full bg-[#F0F0F0] px-3 py-1.5 text-xs font-medium text-[#464646] transition hover:bg-[#E4E4E4]"
            >
              {v}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-[#464646]"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={addTag}>
          추가
        </Button>
      </div>
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
          specialties: p.specialties,
          specialtyLabel: p.specialtyLabel,
          badges: p.badges,
          photoURL: p.photoURL,
          photoPath: p.photoPath ?? "",
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
        description="노출 설정은 웹 장착 대행점과 앱에 함께 적용됩니다."
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
          <label className="flex items-center gap-2 text-sm text-[#464646]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => patch("isActive", e.target.checked)}
            />
            노출 (웹 · 앱 동시)
          </label>
        </Card>

        <Card className="space-y-5">
          <h2 className="text-sm font-semibold text-[#464646]">
            전문분야 · 뱃지
          </h2>
          <TagListEditor
            label="전문분야"
            values={form.specialties}
            placeholder="예: 엔진"
            onChange={(specialties) => patch("specialties", specialties)}
          />
          <Input
            label="앱 카드 전문 문구 (한 줄)"
            value={form.specialtyLabel}
            onChange={(e) => patch("specialtyLabel", e.target.value)}
            placeholder="수입차 엔진, 미션, 오버홀 전문"
          />
          <TagListEditor
            label="뱃지"
            values={form.badges}
            placeholder="예: 당일 예약 가능"
            onChange={(badges) => patch("badges", badges)}
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
          <input
            id={fileInputId}
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "업로드 중…" : "사진 업로드"}
            </Button>
            {form.photoURL ? (
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => {
                  patch("photoURL", "");
                  patch("photoPath", "");
                }}
              >
                사진 제거
              </Button>
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
