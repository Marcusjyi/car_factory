"use client";

import { useCallback, useEffect, useState } from "react";
import { getProductRepository } from "@/features/products/product-repository";
import type { ChatRoomDocument } from "@/types/chat";
import type { ProductStatus } from "@/types/product";
import { cn } from "@/lib/utils";

type ChatStatusBadgeProps = {
  room: ChatRoomDocument;
};

/** 채팅 헤더용 — 예약중/판매완료 배지만 표시 */
export function ChatStatusBadge({ room }: ChatStatusBadgeProps) {
  const [status, setStatus] = useState<ProductStatus | null>(null);

  const load = useCallback(async () => {
    const product = await getProductRepository().getPublicProduct(room.productId);
    setStatus(product?.status ?? null);
  }, [room.productId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "reserved") {
    return (
      <span
        className={cn(
          "shrink-0 rounded-md bg-[#016ff9] px-2.5 py-1.5 text-xs font-bold text-white",
        )}
      >
        예약중
      </span>
    );
  }
  if (status === "sold") {
    return (
      <span
        className={cn(
          "shrink-0 rounded-md bg-[#016ff9] px-2.5 py-1.5 text-xs font-bold text-white",
        )}
      >
        판매완료
      </span>
    );
  }
  return null;
}
