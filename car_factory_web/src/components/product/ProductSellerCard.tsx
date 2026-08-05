"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/features/auth/AuthProvider";
import { getPublicSellerProfile } from "@/features/auth/public-seller";
import { getProductRepository } from "@/features/products/product-repository";

type ProductSellerNameProps = {
  productId: string;
  sellerUid: string;
  initialName: string;
};

/** 판매자 닉네임 표시·동기화 (테이블 셀 내용만 렌더) */
export function ProductSellerName({
  productId,
  sellerUid,
  initialName,
}: ProductSellerNameProps) {
  const auth = useContext(AuthContext);
  const [name, setName] = useState(
    initialName && initialName !== "판매자" ? initialName : "",
  );

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const myName = auth?.user?.displayName?.trim() || "";
      const isOwner = Boolean(
        auth?.firebaseUser?.uid && auth.firebaseUser.uid === sellerUid,
      );

      if (isOwner && myName) {
        if (!cancelled) setName(myName);
        try {
          const { syncPublicSellerProfile } = await import(
            "@/features/auth/public-seller"
          );
          await syncPublicSellerProfile(sellerUid, {
            displayName: myName,
            photoURL: auth?.user?.photoURL ?? null,
            ratingAverage: auth?.user?.tradeStats?.ratingAverage,
            ratingCount: auth?.user?.tradeStats?.ratingCount,
            saleCount: auth?.user?.tradeStats?.saleCount,
          });
          if (initialName !== myName) {
            await getProductRepository().updateOwnedProduct(
              productId,
              sellerUid,
              { sellerDisplayName: myName },
            );
          }
        } catch {
          // 권한 오류 시에도 화면의 닉네임 표시는 유지
        }
        return;
      }

      try {
        const profile = await getPublicSellerProfile(sellerUid);
        if (cancelled) return;
        if (profile?.displayName) {
          setName(profile.displayName);
        }
      } catch {
        // ignore
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [
    auth?.firebaseUser?.uid,
    auth?.user?.displayName,
    auth?.user?.photoURL,
    auth?.user?.tradeStats?.ratingAverage,
    auth?.user?.tradeStats?.ratingCount,
    auth?.user?.tradeStats?.saleCount,
    initialName,
    productId,
    sellerUid,
  ]);

  return <>{name || initialName || "판매자"}</>;
}
