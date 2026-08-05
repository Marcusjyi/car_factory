import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { AddCartItemInput, CartItemDocument } from "@/types/cart";

function cartItemsCol(uid: string) {
  return collection(getClientDb(), "users", uid, "cartItems");
}

function cartItemRef(uid: string, productId: string) {
  return doc(getClientDb(), "users", uid, "cartItems", productId);
}

function productRef(productId: string) {
  return doc(getClientDb(), "products", productId);
}

function yearRangeFromProduct(data: DocumentData): string {
  const from = data.modelYearFrom;
  const to = data.modelYearTo;
  if (from && to) return `${from}~${to}`;
  if (from) return `${from}~`;
  if (to) return `~${to}`;
  return "";
}

function docToCartItem(id: string, data: DocumentData): CartItemDocument {
  return {
    productId: data.productId ?? id,
    sellerUid: data.sellerUid ?? "",
    sellerDisplayName: data.sellerDisplayName ?? "",
    title: data.title ?? "",
    thumbnailURL: data.thumbnailURL ?? "",
    conditionDescription: data.conditionDescription ?? "",
    yearRange: data.yearRange ?? "",
    quantity: Math.max(1, Number(data.quantity) || 1),
    price: Number(data.priceSnapshot ?? data.price) || 0,
    shippingFee: Number(data.shippingFeeSnapshot ?? data.shippingFee) || 0,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : (data.createdAt?.toDate?.()?.toISOString?.() ?? ""),
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : (data.updatedAt?.toDate?.()?.toISOString?.() ?? ""),
  };
}

/**
 * 장바구니 로드 시 상품 문서를 1회 조회해 가격·배송비 변동분만 반영한다.
 * 실시간/주기 구독은 하지 않는다.
 */
async function applyPriceChangesIfNeeded(
  uid: string,
  items: CartItemDocument[],
): Promise<CartItemDocument[]> {
  if (items.length === 0) return [];

  const snaps = await Promise.all(
    items.map((item) => getDoc(productRef(item.productId))),
  );

  const nextItems: CartItemDocument[] = [];
  const persistTasks: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const snap = snaps[i];

    if (!snap.exists()) {
      nextItems.push({ ...item, unavailable: true });
      continue;
    }

    const data = snap.data();
    const liveStatus = String(data.status ?? "");
    if (liveStatus !== "selling") {
      nextItems.push({ ...item, unavailable: true });
      continue;
    }

    const livePrice = Number(data.price) || 0;
    const liveShipping = Math.max(0, Number(data.shippingFee) || 0);
    const priceChanged = livePrice > 0 && livePrice !== item.price;
    const shippingChanged = liveShipping !== item.shippingFee;

    const merged: CartItemDocument = {
      ...item,
      sellerUid: data.sellerUid ?? item.sellerUid,
      sellerDisplayName:
        (data.sellerDisplayName as string | undefined)?.trim() ||
        item.sellerDisplayName,
      title: (data.title as string | undefined)?.trim() || item.title,
      thumbnailURL: (data.thumbnailURL as string | undefined) || item.thumbnailURL,
      conditionDescription:
        (data.conditionDescription as string | undefined) ||
        item.conditionDescription,
      yearRange: yearRangeFromProduct(data) || item.yearRange,
      price: priceChanged ? livePrice : item.price,
      shippingFee: shippingChanged ? liveShipping : item.shippingFee,
      unavailable: false,
    };
    nextItems.push(merged);

    if (priceChanged || shippingChanged) {
      persistTasks.push(
        updateDoc(cartItemRef(uid, item.productId), {
          priceSnapshot: merged.price,
          shippingFeeSnapshot: merged.shippingFee,
          title: merged.title,
          thumbnailURL: merged.thumbnailURL,
          sellerDisplayName: merged.sellerDisplayName,
          conditionDescription: merged.conditionDescription,
          yearRange: merged.yearRange,
          updatedAt: serverTimestamp(),
        }).catch(() => undefined),
      );
    }
  }

  if (persistTasks.length > 0) {
    await Promise.all(persistTasks);
  }
  return nextItems;
}

export async function isProductInCart(uid: string, productId: string) {
  if (!isFirebaseConfigured()) return false;
  const snap = await getDoc(cartItemRef(uid, productId));
  return snap.exists();
}

/** 장바구니 조회 + 가격 변동 시 1회 반영 (구독 없음) */
export async function listCartItems(uid: string): Promise<CartItemDocument[]> {
  if (!isFirebaseConfigured()) return [];
  let items: CartItemDocument[];
  try {
    const q = query(cartItemsCol(uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    items = snap.docs.map((d) => docToCartItem(d.id, d.data()));
  } catch {
    const snap = await getDocs(cartItemsCol(uid));
    items = snap.docs
      .map((d) => docToCartItem(d.id, d.data()))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  return applyPriceChangesIfNeeded(uid, items);
}

export async function countCartItems(uid: string) {
  if (!isFirebaseConfigured()) return 0;
  const snap = await getDocs(cartItemsCol(uid));
  return snap.size;
}

/**
 * 장바구니에 상품 추가 (최초 1회만).
 * 문서 키는 productId(판매 등록 ID). 판매자·가격이 다른 리스팅은 다른 행.
 * 이미 담겨 있으면 변경 없이 alreadyExists만 반환한다.
 */
export async function addCartItem(
  uid: string,
  input: AddCartItemInput,
): Promise<{ alreadyExists: boolean }> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  const productId = input.productId.trim();
  if (!productId) throw new Error("상품 ID가 필요합니다.");
  if (!input.sellerUid) throw new Error("판매자 정보가 필요합니다.");
  if (!input.title.trim()) throw new Error("상품명이 필요합니다.");
  if (!(input.price > 0)) throw new Error("가격 정보가 올바르지 않습니다.");

  const productSnap = await getDoc(productRef(productId));
  if (!productSnap.exists()) {
    throw new Error("상품을 찾을 수 없습니다.");
  }
  const productStatus = String(productSnap.data()?.status ?? "");
  if (productStatus !== "selling") {
    if (productStatus === "reserved") {
      throw new Error("예약 중인 상품은 장바구니에 담을 수 없습니다.");
    }
    if (productStatus === "sold") {
      throw new Error("판매가 완료된 상품입니다.");
    }
    throw new Error("판매 중인 상품만 장바구니에 담을 수 있습니다.");
  }

  const ref = cartItemRef(uid, productId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { alreadyExists: true };
  }

  await setDoc(ref, {
    productId,
    sellerUid: input.sellerUid,
    sellerDisplayName: (input.sellerDisplayName ?? "").trim(),
    title: input.title.trim(),
    thumbnailURL: input.thumbnailURL ?? "",
    conditionDescription: input.conditionDescription ?? "",
    yearRange: input.yearRange ?? "",
    quantity: Math.max(1, input.quantity ?? 1),
    priceSnapshot: input.price,
    shippingFeeSnapshot: Math.max(0, input.shippingFee ?? 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { alreadyExists: false };
}

export async function updateCartItemQuantity(
  uid: string,
  productId: string,
  quantity: number,
) {
  if (!isFirebaseConfigured()) return;
  const next = Math.max(1, Math.floor(quantity));
  await updateDoc(cartItemRef(uid, productId), {
    quantity: next,
    updatedAt: serverTimestamp(),
  });
}

export async function removeCartItem(uid: string, productId: string) {
  if (!isFirebaseConfigured()) return;
  await deleteDoc(cartItemRef(uid, productId));
}

export async function removeCartItems(uid: string, productIds: string[]) {
  if (!isFirebaseConfigured() || productIds.length === 0) return;
  await Promise.all(
    productIds.map((productId) => removeCartItem(uid, productId)),
  );
}
