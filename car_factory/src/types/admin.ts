/**
 * Firestore `admin/{uid}` — 운영자 계정 메타
 * 비밀번호는 저장하지 않음 (Firebase Authentication만 사용)
 */
export type AdminRole = "admin" | "super_admin";
export type AdminStatus = "active" | "disabled";

export interface AdminDocument {
  uid: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  status: AdminStatus;
  /** ISO string on client / Timestamp in Firestore */
  createdAt: string;
  updatedAt: string;
  createdByUid: string | null;
}
