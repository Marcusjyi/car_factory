"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/features/auth/AuthProvider";
import { countCartItems } from "@/features/cart/cart-repository";

/** 헤더 장바구니 배지용 — 로그인 사용자 카트 개수 */
export function useCartCount(fallback = 0) {
  const auth = useContext(AuthContext);
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (auth?.status !== "authenticated" || !auth.firebaseUser) {
        if (!cancelled) setCount(0);
        return;
      }
      try {
        const next = await countCartItems(auth.firebaseUser.uid);
        if (!cancelled) setCount(next);
      } catch {
        if (!cancelled) setCount(0);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth?.firebaseUser, auth?.status]);

  return count;
}
