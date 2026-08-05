import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";

export type PublicSellerProfile = {
  displayName: string;
  photoURL: string | null;
  ratingAverage: number;
  ratingCount: number;
  saleCount: number;
};

function publicProfileRef(uid: string) {
  return doc(getClientDb(), "publicProfiles", uid);
}

/** 닉네임·평점만 공개 저장 (실명·연락처·주소 제외) */
export async function syncPublicSellerProfile(
  uid: string,
  input: {
    displayName: string;
    photoURL?: string | null;
    ratingAverage?: number;
    ratingCount?: number;
    saleCount?: number;
  },
) {
  if (!isFirebaseConfigured() || !uid) return;
  const displayName = input.displayName.trim().slice(0, 80);
  if (!displayName) return;

  await setDoc(
    publicProfileRef(uid),
    {
      displayName,
      photoURL: input.photoURL ?? null,
      tradeStats: {
        ratingAverage: Number(input.ratingAverage) || 0,
        ratingCount: Number(input.ratingCount) || 0,
        saleCount: Number(input.saleCount) || 0,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** 상품 상세 등 — Admin SDK 없이 클라이언트 SDK로 조회 */
export async function getPublicSellerProfile(
  uid: string,
): Promise<PublicSellerProfile | null> {
  if (!uid || !isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(publicProfileRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const displayName =
      typeof data.displayName === "string" ? data.displayName.trim() : "";
    if (!displayName) return null;
    const tradeStats = data.tradeStats ?? {};
    return {
      displayName,
      photoURL:
        typeof data.photoURL === "string" ? data.photoURL : null,
      ratingAverage: Number(tradeStats.ratingAverage) || 0,
      ratingCount: Number(tradeStats.ratingCount) || 0,
      saleCount: Number(tradeStats.saleCount) || 0,
    };
  } catch {
    // 규칙 미배포·권한 부족 시에도 상세 페이지는 계속 동작
    return null;
  }
}
