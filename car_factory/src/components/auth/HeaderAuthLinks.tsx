"use client";

import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "@/features/auth/AuthProvider";

function GuestLinks() {
  return (
    <div className="flex w-full items-center justify-between gap-2 text-xs text-text-secondary">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Link href="/login" className="hover:text-primary">
          로그인
        </Link>
        <Link href="/login" className="hover:text-primary">
          회원가입
        </Link>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <Link href="/mypage" className="hover:text-primary">
          마이페이지
        </Link>
        <Link href="/mypage/orders" className="hover:text-primary">
          주문/배송
        </Link>
        <Link href="/favorites" className="hover:text-primary">
          찜한 상품
        </Link>
      </div>
    </div>
  );
}

export function HeaderAuthLinks() {
  const auth = useContext(AuthContext);

  if (!auth || auth.status === "loading") {
    if (!auth) return <GuestLinks />;
    return (
      <div className="flex w-full items-center justify-between text-xs text-text-muted">
        <span>확인 중...</span>
      </div>
    );
  }

  if (auth.status === "authenticated") {
    return (
      <div className="flex w-full items-center justify-between gap-2 overflow-x-auto text-xs text-text-secondary">
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <span className="font-medium text-text">
            {auth.user?.displayName || "회원"}님
          </span>
          <button
            type="button"
            onClick={() => void auth.signOut()}
            className="hover:text-primary"
          >
            로그아웃
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <Link href="/mypage" className="hover:text-primary">
            마이페이지
          </Link>
          <Link
            href="/mypage/orders"
            className="hidden hover:text-primary sm:inline"
          >
            주문/배송
          </Link>
          <Link href="/favorites" className="hover:text-primary">
            찜한 상품
          </Link>
        </div>
      </div>
    );
  }

  return <GuestLinks />;
}
