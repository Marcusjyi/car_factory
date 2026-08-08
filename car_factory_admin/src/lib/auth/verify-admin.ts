import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { parseAdminDoc, validateAdminAccess } from "@/lib/auth/parse-admin";
import type { AdminUser } from "@/lib/types";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "car-factory-40a14";

const DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  "default";

function firestoreRestValue(node: unknown): unknown {
  if (!node || typeof node !== "object") return undefined;
  const o = node as Record<string, unknown>;
  if ("stringValue" in o) return o.stringValue;
  if ("booleanValue" in o) return o.booleanValue;
  if ("integerValue" in o) return Number(o.integerValue);
  if ("doubleValue" in o) return Number(o.doubleValue);
  if ("timestampValue" in o) return o.timestampValue;
  if ("nullValue" in o) return null;
  if ("mapValue" in o) {
    const fields = (o.mapValue as { fields?: Record<string, unknown> })
      ?.fields;
    if (!fields) return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = firestoreRestValue(v);
    }
    return out;
  }
  if ("arrayValue" in o) {
    const values = (o.arrayValue as { values?: unknown[] })?.values ?? [];
    return values.map(firestoreRestValue);
  }
  return undefined;
}

/** User ID 토큰으로 admins/{uid} 읽기 (클라이언트 규칙 허용 경로) */
async function loadAdminViaUserToken(
  uid: string,
  idToken: string,
): Promise<{ admin: AdminUser | null; error: string | null }> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/admins/${uid}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (res.status === 404) {
    return { admin: null, error: "관리자 권한이 없습니다." };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      admin: null,
      error: `관리자 확인 실패 (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`,
    };
  }
  const body = (await res.json()) as {
    fields?: Record<string, unknown>;
  };
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body.fields ?? {})) {
    data[k] = firestoreRestValue(v);
  }
  const admin = parseAdminDoc(uid, data);
  const accessError = validateAdminAccess(admin);
  if (accessError) return { admin: null, error: accessError };
  return { admin, error: null };
}

async function loadAdminByUid(
  uid: string,
  idToken?: string,
): Promise<{
  admin: AdminUser | null;
  error: string | null;
}> {
  try {
    const adminDoc = await getAdminFirestore().collection("admins").doc(uid).get();
    if (!adminDoc.exists) {
      return { admin: null, error: "관리자 권한이 없습니다." };
    }
    const admin = parseAdminDoc(uid, adminDoc.data()!);
    const accessError = validateAdminAccess(admin);
    if (accessError) return { admin: null, error: accessError };
    return { admin, error: null };
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? Number((err as { code?: number }).code)
        : undefined;
    const message = err instanceof Error ? err.message : String(err);
    const permissionDenied =
      code === 7 || /PERMISSION_DENIED|insufficient permissions/i.test(message);

    if (permissionDenied && idToken) {
      return loadAdminViaUserToken(uid, idToken);
    }
    throw err;
  }
}

export async function verifyAdminToken(token: string) {
  const decoded = await getAdminAuth().verifyIdToken(token);
  const { admin } = await loadAdminByUid(decoded.uid, token);
  return admin;
}

export async function verifyAdminTokenWithError(token: string) {
  const decoded = await getAdminAuth().verifyIdToken(token);

  // Custom claim만으로도 통과 (Storage 규칙과 동일)
  if (decoded.admin === true) {
    const role =
      decoded.role === "admin" || decoded.role === "super_admin"
        ? decoded.role
        : "admin";
    return {
      admin: {
        uid: decoded.uid,
        email: String(decoded.email ?? ""),
        displayName: String(decoded.name ?? ""),
        isApproved: true,
        role,
        createdAt: null,
        updatedAt: null,
      } satisfies AdminUser,
      error: null,
    };
  }

  const loaded = await loadAdminByUid(decoded.uid, token);
  if (loaded.admin && decoded.admin !== true) {
    try {
      await getAdminAuth().setCustomUserClaims(decoded.uid, {
        admin: true,
        role: loaded.admin.role,
      });
    } catch {
      // 서비스 계정 없으면 스킵 — Storage는 password 제공자 폴백 사용
    }
  }
  return loaded;
}

export async function getTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function verifyAdminRequest(request: Request) {
  const token = await getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function verifyAdminRequestWithError(request: Request) {
  const token = await getTokenFromRequest(request);
  if (!token) {
    return { admin: null, error: "인증 토큰이 없습니다." };
  }
  return verifyAdminTokenWithError(token);
}
