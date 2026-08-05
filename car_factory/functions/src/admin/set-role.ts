/**
 * Admin accounts — Firestore `admins/{uid}` (mechanic_admin pattern)
 * Fields: email, displayName, employeeId?, isApproved, role(admin|super_admin), timestamps
 * Auth: email/password only. No custom claims gate.
 */
import {getApp, getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const DATABASE_ID = "default";
const db = getFirestore(getApp(), DATABASE_ID);
const ADMIN_COL = "admins";

const ALLOWED_ROLES = ["admin", "super_admin"] as const;
type AdminRole = (typeof ALLOWED_ROLES)[number];

const INITIAL_SUPERADMIN_EMAIL = "marcusjyi@codepado.com";

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" &&
    (ALLOWED_ROLES as readonly string[]).includes(value);
}

async function getCallerAdmin(uid: string) {
  const snap = await db.doc(`${ADMIN_COL}/${uid}`).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.isApproved !== true) return null;
  if (!isAdminRole(data.role)) return null;
  return {uid, ...data, role: data.role as AdminRole};
}

function requireSuperAdmin(
  caller: Awaited<ReturnType<typeof getCallerAdmin>>,
) {
  if (!caller || caller.role !== "super_admin") {
    throw new HttpsError(
      "permission-denied",
      "super_admin만 관리자를 추가·변경할 수 있습니다.",
    );
  }
}

async function writeAdminDoc(input: {
  uid: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  employeeId?: string;
}) {
  const ref = db.doc(`${ADMIN_COL}/${input.uid}`);
  const existing = await ref.get();
  await ref.set(
    {
      email: input.email,
      displayName: input.displayName,
      employeeId: input.employeeId ?? null,
      isApproved: true,
      role: input.role,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : {createdAt: FieldValue.serverTimestamp()}),
    },
    {merge: true},
  );
}

/** admins 컬렉션이 비어 있을 때만 최초 super_admin 생성 */
export const seedInitialAdmin = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    const existing = await db.collection(ADMIN_COL).limit(1).get();
    if (!existing.empty) {
      throw new HttpsError(
        "failed-precondition",
        "이미 admins 계정이 있습니다. createAdminUser를 사용하세요.",
      );
    }

    const email = String(request.data?.email ?? "").trim().toLowerCase();
    const password = String(request.data?.password ?? "");
    const displayName =
      String(request.data?.displayName ?? "").trim() || "Super Admin";

    if (email !== INITIAL_SUPERADMIN_EMAIL) {
      throw new HttpsError(
        "permission-denied",
        `최초 계정은 ${INITIAL_SUPERADMIN_EMAIL} 만 가능합니다.`,
      );
    }
    if (password.length < 8) {
      throw new HttpsError(
        "invalid-argument",
        "비밀번호는 8자 이상이어야 합니다.",
      );
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, {
        password,
        displayName,
        emailVerified: true,
      });
    } catch {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
    }

    const uid = userRecord.uid;
    await writeAdminDoc({
      uid,
      email,
      displayName,
      role: "super_admin",
      employeeId: "000001",
    });

    await db.collection("adminAuditLogs").add({
      actorUid: uid,
      action: "seedInitialAdmin",
      targetType: "admins",
      targetId: uid,
      before: null,
      after: {email, role: "super_admin", isApproved: true},
      reason: "initial seed",
      createdAt: FieldValue.serverTimestamp(),
    });

    return {ok: true as const, uid, email, role: "super_admin" as const};
  },
);

export const createAdminUser = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const caller = await getCallerAdmin(request.auth.uid);
    requireSuperAdmin(caller);

    const email = String(request.data?.email ?? "").trim().toLowerCase();
    const password = String(request.data?.password ?? "");
    const displayName = String(request.data?.displayName ?? "").trim() || null;
    const roleRaw = request.data?.role;
    const role: AdminRole =
      roleRaw === "super_admin" ? "super_admin" : "admin";
    const reason = String(request.data?.reason ?? "").trim() || "create admin";

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "이메일이 필요합니다.");
    }
    if (password.length < 8) {
      throw new HttpsError(
        "invalid-argument",
        "비밀번호는 8자 이상이어야 합니다.",
      );
    }
    if (!isAdminRole(role)) {
      throw new HttpsError(
        "invalid-argument",
        "role(admin|super_admin)이 필요합니다.",
      );
    }

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName ?? undefined,
        emailVerified: true,
      });
    } catch (e: unknown) {
      const code = (e as {code?: string})?.code;
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "이미 등록된 이메일입니다.");
      }
      throw new HttpsError(
        "internal",
        e instanceof Error ? e.message : "계정 생성 실패",
      );
    }

    const uid = userRecord.uid;
    await writeAdminDoc({
      uid,
      email,
      displayName,
      role,
    });

    await db.collection("adminAuditLogs").add({
      actorUid: request.auth.uid,
      action: "createAdminUser",
      targetType: "admins",
      targetId: uid,
      before: null,
      after: {email, role, isApproved: true},
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {ok: true as const, uid, email, role};
  },
);

export const listAdmins = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    const caller = await getCallerAdmin(request.auth.uid);
    if (!caller) {
      throw new HttpsError("permission-denied", "관리자만 조회할 수 있습니다.");
    }

    const snap = await db.collection(ADMIN_COL).limit(200).get();
    const admins = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        email: (d.email as string) ?? null,
        displayName: (d.displayName as string | null) ?? null,
        role: (d.role as string) ?? "admin",
        isApproved: d.isApproved === true,
      };
    });
    admins.sort(
      (a, b) =>
        a.role.localeCompare(b.role) ||
        (a.email ?? "").localeCompare(b.email ?? ""),
    );

    return {admins, callerRole: caller.role};
  },
);

export const setAdminRole = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    const caller = await getCallerAdmin(request.auth.uid);
    requireSuperAdmin(caller);

    const targetUid = String(request.data?.targetUid ?? "").trim();
    const role = request.data?.role;
    const reason = String(request.data?.reason ?? "").trim() || "set role";

    if (!targetUid || !isAdminRole(role)) {
      throw new HttpsError("invalid-argument", "targetUid와 role이 필요합니다.");
    }
    if (targetUid === request.auth.uid && role !== "super_admin") {
      throw new HttpsError(
        "failed-precondition",
        "자신의 super_admin 권한은 해제할 수 없습니다.",
      );
    }

    const ref = db.doc(`${ADMIN_COL}/${targetUid}`);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "admins 문서가 없습니다.");
    }
    const before = snap.data();

    await ref.update({
      role,
      isApproved: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection("adminAuditLogs").add({
      actorUid: request.auth.uid,
      action: "setAdminRole",
      targetType: "admins",
      targetId: targetUid,
      before,
      after: {role, isApproved: true},
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {ok: true as const, targetUid, role};
  },
);

export const revokeAdminAccess = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    const caller = await getCallerAdmin(request.auth.uid);
    requireSuperAdmin(caller);

    const targetUid = String(request.data?.targetUid ?? "").trim();
    const reason = String(request.data?.reason ?? "").trim() || "revoke admin";
    if (!targetUid) {
      throw new HttpsError("invalid-argument", "targetUid가 필요합니다.");
    }
    if (targetUid === request.auth.uid) {
      throw new HttpsError(
        "failed-precondition",
        "자신의 관리자 권한은 해제할 수 없습니다.",
      );
    }

    const ref = db.doc(`${ADMIN_COL}/${targetUid}`);
    const snap = await ref.get();
    const before = snap.data() ?? null;

    if (snap.exists) {
      await ref.update({
        isApproved: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await db.collection("adminAuditLogs").add({
      actorUid: request.auth.uid,
      action: "revokeAdminAccess",
      targetType: "admins",
      targetId: targetUid,
      before,
      after: {isApproved: false},
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {ok: true as const, targetUid};
  },
);
