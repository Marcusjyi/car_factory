"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getClientAuth,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import {
  isProfileComplete,
  ensureUserDocument,
} from "@/features/auth/user-repository";
import type { AuthProviderId, UserDocument } from "@/types/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  user: UserDocument | null;
  profileComplete: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => void;
  signInWithNaver: () => void;
  completeCustomTokenSignIn: (
    token: string,
    provider: AuthProviderId,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

const SESSION_COOKIE = "cf_auth";
const LOGIN_NEXT_KEY = "cf_login_next";
const GOOGLE_REDIRECT_PENDING_KEY = "cf_google_redirect_pending";

function setSessionFlag(loggedIn: boolean) {
  if (typeof document === "undefined") return;
  if (loggedIn) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/**
 * Google redirect 사용 여부
 * - iOS Safari/WebKit: ITP가 *.firebaseapp.com 서드파티 저장소를 막아
 *   redirect 후 getRedirectResult 가 null → 로그인 화면으로 되돌아감.
 *   Firebase Option 2(popup) 사용.
 * - Android 등: 2FA 후 popup 결과 유실 대비 redirect 유지.
 */
function prefersGoogleRedirect() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPhone / iPad / iPod / iPadOS 13+
  if (/iPhone|iPad|iPod/i.test(ua)) return false;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return false;
  }
  if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  return false;
}

function markGoogleRedirectPending() {
  try {
    sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
  } catch {
    // ignore
  }
}

function consumeGoogleRedirectPending() {
  try {
    const pending = sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY);
    sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
    return pending === "1";
  } catch {
    return false;
  }
}

function rememberLoginNext() {
  if (typeof window === "undefined") return;
  try {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) sessionStorage.setItem(LOGIN_NEXT_KEY, next);
  } catch {
    // ignore
  }
}

export function consumeLoginNext(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = sessionStorage.getItem(LOGIN_NEXT_KEY);
    sessionStorage.removeItem(LOGIN_NEXT_KEY);
    return stored || fallback;
  } catch {
    return fallback;
  }
}

function buildOAuthUrl(
  provider: "kakao" | "naver",
): string | null {
  if (provider === "kakao") {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    if (!clientId || !redirectUri) return null;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
  if (!clientId || !redirectUri) return null;
  const state = crypto.randomUUID();
  sessionStorage.setItem("naver_oauth_state", state);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseReady = isFirebaseConfigured();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserDocument | null>(null);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) {
      setUser(null);
      return;
    }
    const doc = await ensureUserDocument(firebaseUser);
    setUser(doc);
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseReady) {
      setStatus("unauthenticated");
      setSessionFlag(false);
      return;
    }

    const auth = getClientAuth();
    let cancelled = false;

    // 모바일 redirect 로그인 복귀 처리 (popup 대비)
    void getRedirectResult(auth)
      .then(async (result) => {
        const wasPending = consumeGoogleRedirectPending();
        if (cancelled) return;
        if (!result?.user) {
          // ITP 등으로 세션이 유실되면 null — 로그인 화면으로만 조용히 돌아오던 케이스
          if (wasPending && typeof window !== "undefined") {
            try {
              sessionStorage.setItem(
                "cf_auth_error",
                "Google 로그인 세션을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
              );
            } catch {
              // ignore
            }
          }
          return;
        }
        try {
          const doc = await ensureUserDocument(result.user, "google");
          if (cancelled) return;
          setUser(doc);
          setSessionFlag(true);
        } catch (err) {
          console.error("[auth] getRedirectResult ensureUser failed", err);
        }
      })
      .catch((err) => {
        consumeGoogleRedirectPending();
        console.error("[auth] getRedirectResult failed", err);
        if (typeof window !== "undefined") {
          try {
            const message =
              err instanceof Error
                ? err.message
                : "Google 로그인에 실패했습니다.";
            sessionStorage.setItem("cf_auth_error", message);
          } catch {
            // ignore
          }
        }
      });

    const unsub = onAuthStateChanged(auth, async (next) => {
      setFirebaseUser(next);
      if (!next) {
        setUser(null);
        setStatus("unauthenticated");
        setSessionFlag(false);
        return;
      }
      try {
        const doc = await ensureUserDocument(next);
        setUser(doc);
        setSessionFlag(true);
        setStatus("authenticated");
        const nickname = doc.displayName?.trim();
        if (nickname) {
          try {
            const { syncPublicSellerProfile } = await import(
              "@/features/auth/public-seller"
            );
            await syncPublicSellerProfile(next.uid, {
              displayName: nickname,
              photoURL: doc.photoURL,
              ratingAverage: doc.tradeStats?.ratingAverage,
              ratingCount: doc.tradeStats?.ratingCount,
              saleCount: doc.tradeStats?.saleCount,
            });
          } catch {
            // publicProfiles 권한 오류는 무시 (상품 sellerDisplayName으로 대체)
          }
          try {
            const { getProductRepository } = await import(
              "@/features/products/product-repository"
            );
            await getProductRepository().syncSellerDisplayName(
              next.uid,
              nickname,
            );
          } catch {
            // 상품 닉네임 동기화 실패는 무시
          }
        }
      } catch (err) {
        console.error("[auth] ensureUserDocument failed", err);
        setUser(null);
        setSessionFlag(true);
        setStatus("authenticated");
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [firebaseReady]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseReady) {
      throw new Error("Firebase가 설정되지 않았습니다.");
    }
    const auth = getClientAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    rememberLoginNext();

    if (prefersGoogleRedirect()) {
      markGoogleRedirectPending();
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const doc = await ensureUserDocument(result.user, "google");
      setUser(doc);
      setSessionFlag(true);
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      // 팝업 차단·강제 종료 시 redirect로 재시도 (모바일 WebView 등)
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        markGoogleRedirectPending();
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  }, [firebaseReady]);

  const completeCustomTokenSignIn = useCallback(
    async (token: string, provider: AuthProviderId) => {
      if (!firebaseReady) {
        throw new Error("Firebase가 설정되지 않았습니다.");
      }
      const auth = getClientAuth();
      const result = await signInWithCustomToken(auth, token);
      const doc = await ensureUserDocument(result.user, provider);
      setUser(doc);
      setSessionFlag(true);
    },
    [firebaseReady],
  );

  const signInWithKakao = useCallback(() => {
    const url = buildOAuthUrl("kakao");
    if (!url) {
      throw new Error(
        "카카오 로그인 환경 변수(NEXT_PUBLIC_KAKAO_REST_API_KEY, REDIRECT_URI)가 필요합니다.",
      );
    }
    window.location.href = url;
  }, []);

  const signInWithNaver = useCallback(() => {
    const url = buildOAuthUrl("naver");
    if (!url) {
      throw new Error(
        "네이버 로그인 환경 변수(NEXT_PUBLIC_NAVER_CLIENT_ID, REDIRECT_URI)가 필요합니다.",
      );
    }
    window.location.href = url;
  }, []);

  const signOut = useCallback(async () => {
    if (firebaseReady) {
      await firebaseSignOut(getClientAuth());
    }
    setUser(null);
    setFirebaseUser(null);
    setSessionFlag(false);
    setStatus("unauthenticated");
  }, [firebaseReady]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      firebaseUser,
      user,
      profileComplete: isProfileComplete(user),
      firebaseReady,
      signInWithGoogle,
      signInWithKakao,
      signInWithNaver,
      completeCustomTokenSignIn,
      signOut,
      refreshUser,
    }),
    [
      status,
      firebaseUser,
      user,
      firebaseReady,
      signInWithGoogle,
      signInWithKakao,
      signInWithNaver,
      completeCustomTokenSignIn,
      signOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
