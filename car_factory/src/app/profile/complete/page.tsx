"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { completeUserProfile } from "@/features/auth/user-repository";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "이름은 2자 이상이어야 합니다.")
    .max(20, "이름은 20자 이하로 입력하세요."),
  displayName: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하로 입력하세요."),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^01[016789]\d{7,8}$/, "휴대전화 번호를 확인해주세요. (예: 01012345678)"),
  defaultRegion: z.string().trim().min(1, "거래 지역을 선택해주세요."),
  address1: z.string().trim().min(3, "기본 주소를 입력해주세요."),
  address2: z.string().trim().optional(),
});

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

function ProfileCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/";
  const { firebaseUser, user, status, refreshUser, firebaseReady } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [defaultRegion, setDefaultRegion] = useState(user?.defaultRegion ?? "");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName((v) => v || user.name || "");
    setDisplayName((v) => v || user.displayName || "");
    setPhoneNumber((v) => v || user.phoneNumber || "");
    setDefaultRegion((v) => v || user.defaultRegion || "");
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({
      name,
      displayName,
      phoneNumber: phoneNumber.replace(/-/g, ""),
      defaultRegion,
      address1,
      address2,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
      return;
    }
    if (!firebaseUser) {
      setError("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    if (!firebaseReady) {
      setError("Firebase 설정이 필요합니다.");
      return;
    }

    setSaving(true);
    try {
      await completeUserProfile(firebaseUser.uid, {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        phoneNumber: parsed.data.phoneNumber,
        defaultRegion: parsed.data.defaultRegion,
        address: {
          address1: parsed.data.address1,
          address2: parsed.data.address2 ?? "",
        },
      });
      await refreshUser();
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "프로필 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        확인 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold">프로필 완성</h1>
          <p className="mt-2 text-sm text-text-secondary">
            거래를 위해 이름, 닉네임, 휴대전화, 거래 지역, 주소를 입력해주세요.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">이름</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-strong px-3 text-sm outline-none focus:border-primary"
                placeholder="예: 김카팩"
              />
              <span className="mt-1.5 block text-xs text-text-muted">
                배송·거래에 사용할 실명입니다.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">닉네임</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-strong px-3 text-sm outline-none focus:border-primary"
                placeholder="예: 카팩마스터"
              />
              <span className="mt-1.5 block text-xs text-text-muted">
                서비스에서 보여지는 이름입니다.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">
                휴대전화
              </span>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-strong px-3 text-sm outline-none focus:border-primary"
                placeholder="01012345678"
                inputMode="tel"
              />
              <span className="mt-1.5 block text-xs text-text-muted">
                하이픈(-) 없이 숫자만 입력해 주세요. 예: 01012345678
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">
                거래 지역
              </span>
              <select
                value={defaultRegion}
                onChange={(e) => setDefaultRegion(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-strong px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">지역 선택</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">주소</span>
              <input
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-strong px-3 text-sm outline-none focus:border-primary"
                placeholder="도로명 또는 지번 주소"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">
                상세 주소
              </span>
              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="h-11 w-full rounded-lg border border-border-strong px-3 text-sm outline-none focus:border-primary"
                placeholder="동·호수 등 (선택)"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ProfileCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
          불러오는 중...
        </div>
      }
    >
      <ProfileCompleteInner />
    </Suspense>
  );
}
