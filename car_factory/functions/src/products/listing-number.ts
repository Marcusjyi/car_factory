import {getApp, getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-northeast3";
const DATABASE_ID = "default";

/** Asia/Seoul 기준 YYMMDD (예: 260730) */
export function seoulDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year.slice(-2)}${month}${day}`;
}

function formatListingNumber(dateKey: string, seq: number): string {
  return `CF-${dateKey}-${String(seq).padStart(5, "0")}`;
}

/**
 * products 문서 생성 시 CF-YYMMDD-NNNNN 고유번호 발급.
 * 일별 시퀀스는 productListingCounters/{yyMMdd} 트랜잭션으로 증가.
 */
export const onProductCreatedAssignListingNumber = onDocumentCreated(
  {
    document: "products/{productId}",
    database: DATABASE_ID,
    region: REGION,
  },
  async (event) => {
    const productId = event.params.productId;
    const snap = event.data;
    if (!snap) return;

    const existing = snap.data()?.listingNumber;
    if (typeof existing === "string" && existing.trim()) {
      logger.info("listingNumber already set", {productId, existing});
      return;
    }

    const db = getFirestore(getApp(), DATABASE_ID);
    const productRef = db.collection("products").doc(productId);
    const dateKey = seoulDateKey();
    const counterRef = db.collection("productListingCounters").doc(dateKey);

    try {
      const listingNumber = await db.runTransaction(async (tx) => {
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists) {
          throw new Error("product missing");
        }
        const current = productSnap.data()?.listingNumber;
        if (typeof current === "string" && current.trim()) {
          return current.trim();
        }

        const counterSnap = await tx.get(counterRef);
        const prev = counterSnap.exists ?
          Number(counterSnap.data()?.seq) || 0 :
          0;
        const next = prev + 1;
        const code = formatListingNumber(dateKey, next);

        tx.set(
          counterRef,
          {
            seq: next,
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
        tx.update(productRef, {
          listingNumber: code,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return code;
      });

      logger.info("listingNumber assigned", {productId, listingNumber});
    } catch (error) {
      logger.error("listingNumber assign failed", {productId, error});
      throw error;
    }
  },
);
