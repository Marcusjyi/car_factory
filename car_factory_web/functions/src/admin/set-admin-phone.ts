import {getApp, getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-northeast3";
const DATABASE_ID = "default";

function db() {
  return getFirestore(getApp(), DATABASE_ID);
}

function toE164Kr(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith("82") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 11) {
    return `+82${digits.slice(1)}`;
  }
  return null;
}

async function assertAdmin(uid: string) {
  const snap = await db().collection("admins").doc(uid).get();
  const data = snap.data();
  if (
    !snap.exists ||
    data?.isApproved !== true ||
    !["admin", "super_admin"].includes(String(data?.role))
  ) {
    throw new HttpsError("permission-denied", "관리자만 실행할 수 있습니다.");
  }
  return data;
}

/** 로그인한 관리자 본인 phoneNumber 등록 (Firestore + Auth) */
export const setMyAdminPhone = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  await assertAdmin(request.auth.uid);
  const phone = toE164Kr(String(request.data?.phoneNumber ?? "").trim());
  if (!phone) {
    throw new HttpsError(
      "invalid-argument",
      "휴대폰 번호 형식이 올바르지 않습니다. 예: 01012345678",
    );
  }

  await db()
    .collection("admins")
    .doc(request.auth.uid)
    .set(
      {
        phoneNumber: phone,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

  let authUpdated = false;
  try {
    await getAuth().updateUser(request.auth.uid, {phoneNumber: phone});
    authUpdated = true;
  } catch (err) {
    logger.warn("Auth phoneNumber update failed", {
      uid: request.auth.uid,
      err,
    });
  }

  return {ok: true as const, phoneNumber: phone, authUpdated};
});
