"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/features/auth/AuthProvider";
import { getProductRepository } from "@/features/products/product-repository";

const SESSION_KEY_PREFIX = "cf_product_viewed:";

type ProductViewCountProps = {
  productId: string;
  sellerUid: string;
  initialCount: number;
};

/** 상세 진입 시 조회수 +1 (세션당 1회, 판매자 본인 제외) */
export function ProductViewCount({
  productId,
  sellerUid,
  initialCount,
}: ProductViewCountProps) {
  const auth = useContext(AuthContext);
  const [count, setCount] = useState(Math.max(0, initialCount));

  useEffect(() => {
    if (auth?.status === "loading") return;

    const isOwner = Boolean(
      auth?.status === "authenticated" &&
        auth.firebaseUser?.uid &&
        auth.firebaseUser.uid === sellerUid,
    );
    if (isOwner) return;

    const key = `${SESSION_KEY_PREFIX}${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage 불가 시에도 1회 시도
    }

    let cancelled = false;
    void getProductRepository()
      .incrementViewCount(productId)
      .then(() => {
        if (!cancelled) setCount((c) => c + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [auth?.firebaseUser?.uid, auth?.status, productId, sellerUid]);

  return (
    <span className="rounded-md bg-bg px-2.5 py-1 text-xs text-text-secondary">
      조회 {count.toLocaleString("ko-KR")}
    </span>
  );
}
