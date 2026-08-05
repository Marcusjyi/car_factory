"use client";

import { useContext, useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageCircle,
  Pencil,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { AuthContext } from "@/features/auth/AuthProvider";
import { addCartItem } from "@/features/cart/cart-repository";
import { getOrCreateChatRoom } from "@/features/chat/chat-api";
import { getProductRepository } from "@/features/products/product-repository";
import type { ProductStatus } from "@/types/product";
import { formatPrice } from "@/lib/utils";

type ProductDetailActionsProps = {
  productId: string;
  sellerUid: string;
  sellerDisplayName: string;
  productTitle: string;
  thumbnailURL: string;
  conditionDescription: string;
  yearRange: string;
  price: number;
  shippingFee: number;
  productStatus: ProductStatus;
  reservedBuyerUid?: string | null;
  activeOrderId?: string | null;
};

type CartModalState = {
  alreadyExists: boolean;
} | null;

export function ProductDetailActions({
  productId,
  sellerUid,
  sellerDisplayName,
  productTitle,
  thumbnailURL,
  conditionDescription,
  yearRange,
  price,
  shippingFee,
  productStatus,
  reservedBuyerUid,
  activeOrderId,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartModal, setCartModal] = useState<CartModalState>(null);

  const uid =
    auth?.status === "authenticated" ? auth.firebaseUser?.uid : undefined;
  const isOwner = Boolean(uid && uid === sellerUid);
  const isSold = productStatus === "sold";
  const isReserved = productStatus === "reserved";
  const isReservedBuyer = Boolean(
    isReserved && uid && reservedBuyerUid && uid === reservedBuyerUid,
  );

  async function onDelete() {
    if (!auth?.firebaseUser) return;
    const ok = window.confirm(
      `"${productTitle}" 상품을 삭제할까요?\n삭제 후 목록에서 보이지 않습니다.`,
    );
    if (!ok) return;

    setError(null);
    setDeleting(true);
    try {
      await getProductRepository().deleteOwnedProduct(
        productId,
        auth.firebaseUser.uid,
      );
      router.replace("/mypage/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  async function onAddToCart() {
    if (auth?.status === "loading") return;
    if (auth?.status !== "authenticated" || !auth.firebaseUser) {
      router.push(`/login?next=/parts/${productId}`);
      return;
    }
    if (auth.firebaseUser.uid === sellerUid) {
      setError("본인 상품은 장바구니에 담을 수 없습니다.");
      return;
    }

    setError(null);
    setAdding(true);
    try {
      const result = await addCartItem(auth.firebaseUser.uid, {
        productId,
        sellerUid,
        sellerDisplayName,
        title: productTitle,
        thumbnailURL,
        conditionDescription,
        yearRange,
        price,
        shippingFee,
      });
      setCartModal({ alreadyExists: result.alreadyExists });
    } catch (e) {
      setError(e instanceof Error ? e.message : "장바구니 담기에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  }

  async function onStartChat() {
    if (auth?.status === "loading") return;
    if (auth?.status !== "authenticated" || !auth.firebaseUser) {
      router.push(`/login?next=/parts/${productId}`);
      return;
    }
    if (auth.firebaseUser.uid === sellerUid) {
      setError("본인 상품에는 채팅할 수 없습니다.");
      return;
    }

    setError(null);
    setStartingChat(true);
    try {
      const roomId = await getOrCreateChatRoom(productId);
      router.push(`/chat/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "채팅방 생성에 실패했습니다.");
    } finally {
      setStartingChat(false);
    }
  }

  if (isOwner) {
    return (
      <div className="space-y-2">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {isSold ? (
          <Link
            href="/mypage/orders"
            className="flex h-12 w-full items-center justify-center rounded-lg border border-primary text-sm font-bold text-primary hover:bg-primary-light"
          >
            판매 내역에서 채팅하기
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/mypage/products/${productId}/edit`}
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary text-sm font-bold text-primary hover:bg-primary-light"
            >
              <Pencil className="size-4" />
              수정
            </Link>
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={deleting || isReserved}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              삭제
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isSold) {
    return (
      <div className="space-y-2">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="rounded-lg border border-lime-200 bg-lime-50 px-4 py-3 text-center text-sm font-semibold text-lime-900">
          판매가 완료된 상품입니다.
          <span className="mt-1 block text-xs font-normal text-lime-800/80">
            거래 당사자는 채팅으로 연락할 수 있습니다.
          </span>
        </div>
        <button
          type="button"
          onClick={() => void onStartChat()}
          disabled={startingChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {startingChat ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageCircle className="size-4" />
          )}
          채팅으로 문의
        </button>
      </div>
    );
  }

  if (isReserved && !isReservedBuyer) {
    return (
      <div className="rounded-lg border border-lime-200 bg-lime-50 px-4 py-3.5 text-center text-sm font-semibold text-lime-900">
        다른 구매자와 예약 중인 상품입니다.
      </div>
    );
  }

  if (isReserved && isReservedBuyer) {
    return (
      <div className="space-y-2">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void onStartChat()}
            disabled={startingChat}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {startingChat ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            채팅
          </button>
          {activeOrderId ? (
            <Link
              href={`/orders/${activeOrderId}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-primary py-3.5 text-sm font-bold text-primary hover:bg-primary-light"
            >
              거래 상세
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-[1fr_1.35fr] gap-3">
        <button
          type="button"
          onClick={() => void onAddToCart()}
          disabled={adding}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary text-sm font-bold text-primary hover:bg-primary-light disabled:opacity-60"
        >
          {adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          장바구니
        </button>
        <button
          type="button"
          onClick={() => void onStartChat()}
          disabled={startingChat}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {startingChat ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageCircle className="size-4" />
          )}
          채팅하기
        </button>
      </div>

      {cartModal ? (
        <CartAddedModal
          alreadyExists={cartModal.alreadyExists}
          title={productTitle}
          thumbnailURL={thumbnailURL}
          price={price}
          onClose={() => setCartModal(null)}
        />
      ) : null}
    </div>
  );
}

function CartAddedModal({
  alreadyExists,
  title,
  thumbnailURL,
  price,
  onClose,
}: {
  alreadyExists: boolean;
  title: string;
  thumbnailURL: string;
  price: number;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[400px] rounded-xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-text">
            {alreadyExists
              ? "이미 장바구니에 담긴 상품입니다"
              : "장바구니에 담았습니다"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-bg hover:text-text"
            aria-label="닫기"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-5 flex gap-3 rounded-lg bg-bg p-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {thumbnailURL ? (
              <Image
                src={thumbnailURL}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-text">{title}</p>
            <p className="mt-1 text-sm font-bold text-primary">
              {formatPrice(price)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold text-text hover:bg-bg"
          >
            쇼핑 계속하기
          </button>
          <Link
            href="/cart"
            className="flex flex-1 items-center justify-center rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark"
          >
            장바구니 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
