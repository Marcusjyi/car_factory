import {getApp, getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {logger} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-northeast3";
const DATABASE_ID = "default";
/** 사번·비밀번호·휴대폰 재인증 직후 토큰만 허용 */
const MAX_AUTH_AGE_SEC = 5 * 60;

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

type AdminDoc = {
  email?: string;
  displayName?: string;
  employeeId?: string;
  phoneNumber?: string;
  isApproved?: boolean;
  role?: string;
};

async function assertAdmin(uid: string): Promise<AdminDoc> {
  const snap = await db().collection("admins").doc(uid).get();
  const data = (snap.data() ?? {}) as AdminDoc;
  if (
    !snap.exists ||
    data.isApproved !== true ||
    !["admin", "super_admin"].includes(String(data.role))
  ) {
    throw new HttpsError("permission-denied", "관리자만 실행할 수 있습니다.");
  }
  return data;
}

/** 지점 삭제 + adminAuditLogs (사번 + 최근 재인증 + Auth 휴대폰 연동) */
export const deletePartner = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const authTime = Number(request.auth.token.auth_time ?? 0);
  const ageSec = Date.now() / 1000 - authTime;
  if (!authTime || ageSec > MAX_AUTH_AGE_SEC) {
    throw new HttpsError(
      "failed-precondition",
      "재인증이 필요합니다. 사번·비밀번호·휴대폰 인증을 다시 진행하세요.",
    );
  }

  const partnerId = String(request.data?.partnerId ?? "").trim();
  const employeeId = String(request.data?.employeeId ?? "").trim();

  if (!/^[a-zA-Z0-9_-]{2,40}$/.test(partnerId)) {
    throw new HttpsError("invalid-argument", "지점 ID가 올바르지 않습니다.");
  }
  if (!employeeId) {
    throw new HttpsError("invalid-argument", "사번을 입력하세요.");
  }

  const admin = await assertAdmin(request.auth.uid);
  const adminEmployeeId = String(admin.employeeId ?? "").trim();
  if (!adminEmployeeId) {
    throw new HttpsError(
      "failed-precondition",
      "관리자 사번이 등록되어 있지 않습니다. admins.employeeId를 설정하세요.",
    );
  }
  if (employeeId !== adminEmployeeId) {
    throw new HttpsError(
      "permission-denied",
      "본인 사번만 사용할 수 있습니다.",
    );
  }

  const expectedPhone = toE164Kr(admin.phoneNumber);
  if (!expectedPhone) {
    throw new HttpsError(
      "failed-precondition",
      "관리자 휴대폰이 등록되어 있지 않습니다. admins.phoneNumber를 설정하세요.",
    );
  }

  const authUser = await getAuth().getUser(request.auth.uid);
  const authPhone = toE164Kr(authUser.phoneNumber ?? null);
  if (!authPhone || authPhone !== expectedPhone) {
    throw new HttpsError(
      "failed-precondition",
      "휴대폰 인증이 완료되지 않았습니다. 인증번호를 확인한 뒤 다시 시도하세요.",
    );
  }

  const ref = db().collection("partners").doc(partnerId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "지점을 찾을 수 없습니다.");
  }

  const before = snap.data() ?? {};
  await ref.delete();

  const photoPath = before.photoPath ? String(before.photoPath) : "";
  if (photoPath.startsWith("partner-images/")) {
    try {
      await getStorage().bucket().file(photoPath).delete({ignoreNotFound: true});
    } catch (err) {
      logger.warn("partner photo delete skipped", {photoPath, err});
    }
  }

  await db().collection("adminAuditLogs").add({
    actorUid: request.auth.uid,
    actorEmail: admin.email ?? null,
    actorDisplayName: admin.displayName ?? null,
    actorEmployeeId: adminEmployeeId,
    actorPhone: expectedPhone,
    action: "deletePartner",
    targetType: "partners",
    targetId: partnerId,
    before,
    after: null,
    reason: "employeeId + password + firebase phone otp confirmed delete",
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("partner deleted", {
    partnerId,
    actorUid: request.auth.uid,
    actorEmployeeId: adminEmployeeId,
  });

  return {ok: true as const, partnerId};
});
