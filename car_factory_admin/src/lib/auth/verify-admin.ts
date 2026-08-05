import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { parseAdminDoc, validateAdminAccess } from "@/lib/auth/parse-admin";
import type { AdminUser } from "@/lib/types";

async function loadAdminByUid(uid: string): Promise<{
  admin: AdminUser | null;
  error: string | null;
}> {
  const adminDoc = await getAdminFirestore().collection("admins").doc(uid).get();
  if (!adminDoc.exists) {
    return { admin: null, error: "관리자 권한이 없습니다." };
  }
  const admin = parseAdminDoc(uid, adminDoc.data()!);
  const accessError = validateAdminAccess(admin);
  if (accessError) return { admin: null, error: accessError };
  return { admin, error: null };
}

export async function verifyAdminToken(token: string) {
  const decoded = await getAdminAuth().verifyIdToken(token);
  const { admin } = await loadAdminByUid(decoded.uid);
  return admin;
}

export async function verifyAdminTokenWithError(token: string) {
  const decoded = await getAdminAuth().verifyIdToken(token);
  return loadAdminByUid(decoded.uid);
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
