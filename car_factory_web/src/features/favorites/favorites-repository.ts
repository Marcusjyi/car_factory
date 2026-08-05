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
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { FavoriteDocument } from "@/types/favorite";

function favoritesCol(uid: string) {
  return collection(getClientDb(), "users", uid, "favorites");
}

function favoriteRef(uid: string, productId: string) {
  return doc(getClientDb(), "users", uid, "favorites", productId);
}

export async function isProductFavorited(uid: string, productId: string) {
  if (!isFirebaseConfigured()) return false;
  const snap = await getDoc(favoriteRef(uid, productId));
  return snap.exists();
}

export async function listFavoriteIds(uid: string): Promise<string[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(favoritesCol(uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  } catch {
    const snap = await getDocs(favoritesCol(uid));
    return snap.docs.map((d) => d.id);
  }
}

export async function countFavorites(uid: string) {
  const ids = await listFavoriteIds(uid);
  return ids.length;
}

export async function addFavorite(uid: string, productId: string) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  const payload: Omit<FavoriteDocument, "createdAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
  } = {
    productId,
    createdAt: serverTimestamp(),
  };
  await setDoc(favoriteRef(uid, productId), payload);
}

export async function removeFavorite(uid: string, productId: string) {
  if (!isFirebaseConfigured()) return;
  await deleteDoc(favoriteRef(uid, productId));
}

export async function toggleFavorite(uid: string, productId: string) {
  const exists = await isProductFavorited(uid, productId);
  if (exists) {
    await removeFavorite(uid, productId);
    return false;
  }
  await addFavorite(uid, productId);
  return true;
}
