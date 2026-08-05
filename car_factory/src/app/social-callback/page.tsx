"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import type { AuthProviderId } from "@/types/user";

function SocialCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeCustomTokenSignIn, firebaseReady } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const provider = searchParams?.get("provider") as AuthProviderId | null;
      const code = searchParams?.get("code");
      const state = searchParams?.get("state");
      const oauthError = searchParams?.get("error");

      if (oauthError) {
        setError("소셜 로그인이 취소되었거나 실패했습니다.");
        return;
      }
      if (!provider || (provider !== "kakao" && provider !== "naver")) {
        setError("지원하지 않는 로그인 방식입니다.");
        return;
      }
      if (!code) {
        setError("인증 코드가 없습니다.");
        return;
      }
      if (!firebaseReady) {
        setError("Firebase 설정이 필요합니다.");
        return;
      }

      const base = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
      if (!base) {
        setError(
          "Cloud Functions URL(NEXT_PUBLIC_FUNCTIONS_BASE_URL)이 설정되지 않았습니다.",
        );
        return;
      }

      const redirectUri =
        provider === "kakao"
          ? process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
          : process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;

      const endpoint =
        provider === "kakao"
          ? `${base}/kakaoAuthCallback`
          : `${base}/naverAuthCallback`;

      const url = new URL(endpoint);
      url.searchParams.set("code", code);
      if (redirectUri) url.searchParams.set("redirect_uri", redirectUri);
      if (state) url.searchParams.set("state", state);

      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        customToken?: string;
        error?: string;
      };
      if (!res.ok || !data.customToken) {
        setError(data.error ?? "커스텀 토큰 발급에 실패했습니다.");
        return;
      }

      await completeCustomTokenSignIn(data.customToken, provider);
      router.replace("/profile/complete");
    }

    run().catch((e) => {
      setError(e instanceof Error ? e.message : "로그인 처리 중 오류");
    });
  }, [searchParams, completeCustomTokenSignIn, firebaseReady, router]);

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        {error ? (
          <>
            <p className="text-lg font-bold text-text">로그인 실패</p>
            <p className="mt-2 text-sm text-text-secondary">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              로그인으로 돌아가기
            </button>
          </>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-text-secondary">
              소셜 로그인 처리 중...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <SocialCallbackInner />
    </Suspense>
  );
}
