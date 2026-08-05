"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Package,
  Headset,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { useAuth, consumeLoginNext } from "@/features/auth/AuthProvider";
import { isProfileComplete } from "@/features/auth/user-repository";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextFromQuery = searchParams?.get("next") || "/";
  const {
    status,
    user,
    firebaseReady,
    signInWithGoogle,
    signInWithKakao,
    signInWithNaver,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "kakao" | "naver" | null>(
    null,
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("cf_auth_error");
      if (stored) {
        sessionStorage.removeItem("cf_auth_error");
        setError(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const next = consumeLoginNext(nextFromQuery);
    if (user && !isProfileComplete(user)) {
      router.replace(`/profile/complete?next=${encodeURIComponent(next)}`);
      return;
    }
    router.replace(next);
  }, [status, user, router, nextFromQuery]);

  async function handleGoogle() {
    setError(null);
    setPending("google");
    try {
      await signInWithGoogle();
      // redirect 방식이면 페이지가 떠나므로 여기까지 오지 않음
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google 로그인에 실패했습니다.");
      setPending(null);
    }
  }

  function handleKakao() {
    setError(null);
    setPending("kakao");
    try {
      signInWithKakao();
    } catch (e) {
      setPending(null);
      setError(e instanceof Error ? e.message : "카카오 로그인에 실패했습니다.");
    }
  }

  function handleNaver() {
    setError(null);
    setPending("naver");
    try {
      signInWithNaver();
    } catch (e) {
      setPending(null);
      setError(e instanceof Error ? e.message : "네이버 로그인에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-2xl font-extrabold text-text">로그인</h1>
          <p className="mt-2 text-sm text-text-secondary">
            카팩토리에 오신 것을 환영합니다.
          </p>
          <p className="mt-6 text-sm text-text-secondary">
            소셜 계정으로 간편하게 로그인하세요.
            <br />
            별도의 회원가입 없이 바로 이용할 수 있습니다.
          </p>

          {!firebaseReady ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Firebase 환경 변수(`.env.local`)가 아직 설정되지 않았습니다.
              Google/카카오/네이버 키를 추가하면 로그인이 활성화됩니다.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleNaver}
              disabled={!!pending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
            >
              {pending === "naver" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <span className="flex size-6 items-center justify-center rounded bg-white text-sm font-black text-[#03C75A]">
                  N
                </span>
              )}
              네이버로 로그인
            </button>
            <button
              type="button"
              onClick={handleKakao}
              disabled={!!pending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-sm font-bold text-[#191919] hover:brightness-95 disabled:opacity-60"
            >
              {pending === "kakao" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <MessageCircle className="size-5 fill-current" />
              )}
              카카오로 로그인
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!pending || !firebaseReady}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-bold text-text hover:bg-bg disabled:opacity-60"
            >
              {pending === "google" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              구글로 로그인
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-text-muted">
            로그인 시{" "}
            <Link href="/support#terms" className="underline">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="/support#privacy" className="underline">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>

          <p className="mt-8 text-center text-sm text-text-secondary">
            카팩토리가 처음이신가요?{" "}
            <span className="font-bold text-primary">소셜 로그인으로 시작</span>
          </p>
        </section>

        <section className="relative min-h-[420px] overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
          <div className="relative flex h-full flex-col justify-center p-8 text-white md:p-10">
            <div className="mb-3 h-0.5 w-10 bg-primary" />
            <p className="text-sm font-semibold text-primary-soft">
              믿을 수 있는 부품 거래
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-snug md:text-3xl">
              필요한 부품을
              <br />
              합리적인 가격으로
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              카팩토리에서 검증된 중고 부품을 안전하고 간편하게 거래하세요.
            </p>
            <ul className="mt-8 space-y-5">
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5" />
                <div>
                  <p className="text-sm font-bold">안전한 거래 시스템</p>
                  <p className="text-xs text-white/70">
                    카팩토리 검수 시스템으로 안심하고 구매하세요.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Package className="mt-0.5 size-5" />
                <div>
                  <p className="text-sm font-bold">다양한 부품 보유</p>
                  <p className="text-xs text-white/70">
                    국산차부터 수입차까지 다양한 부품을 한 곳에서.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Headset className="mt-0.5 size-5" />
                <div>
                  <p className="text-sm font-bold">전문 고객 지원</p>
                  <p className="text-xs text-white/70">
                    1:1 상담으로 빠르고 정확하게 도와드립니다.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <FeatureBar />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
