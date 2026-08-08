import { toDate } from "@/lib/utils/format";
import type { AdminRole, AdminUser } from "@/lib/types";

export function parseAdminDoc(
  uid: string,
  data: Record<string, unknown>,
): AdminUser | null {
  const role = String(data.role ?? "");
  if (role !== "admin" && role !== "super_admin") return null;

  return {
    uid,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    employeeId: data.employeeId ? String(data.employeeId) : undefined,
    phoneNumber: data.phoneNumber ? String(data.phoneNumber) : undefined,
    isApproved: data.isApproved === true,
    role: role as AdminRole,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function validateAdminAccess(admin: AdminUser | null): string | null {
  if (!admin) return "관리자 권한이 없습니다.";
  if (!admin.isApproved) {
    return "승인 대기 중인 관리자입니다. isApproved를 true로 설정하세요.";
  }
  return null;
}
