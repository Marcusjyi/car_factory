import { NextResponse } from "next/server";
import { verifyAdminRequestWithError } from "@/lib/auth/verify-admin";

export async function GET(request: Request) {
  try {
    const { admin, error } = await verifyAdminRequestWithError(request);
    if (!admin) {
      return NextResponse.json(
        { error: error ?? "관리자 권한이 없습니다." },
        { status: 403 },
      );
    }
    return NextResponse.json(admin);
  } catch {
    return NextResponse.json(
      {
        error:
          "관리자 확인에 실패했습니다. FIREBASE_SERVICE_ACCOUNT_KEY를 확인하세요.",
      },
      { status: 500 },
    );
  }
}
