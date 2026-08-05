import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { verifyAdminRequestWithError } from "@/lib/auth/verify-admin";
import { listAdminsServer } from "@/lib/firestore/server";

export async function GET(request: Request) {
  try {
    const { admin, error } = await verifyAdminRequestWithError(request);
    if (!admin) {
      return NextResponse.json(
        { error: error ?? "관리자 권한이 없습니다." },
        { status: 403 },
      );
    }
    const admins = await listAdminsServer();
    return NextResponse.json(admins);
  } catch {
    return NextResponse.json(
      { error: "관리자 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { admin, error } = await verifyAdminRequestWithError(request);
    if (!admin) {
      return NextResponse.json(
        { error: error ?? "관리자 권한이 없습니다." },
        { status: 403 },
      );
    }
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "super_admin만 관리자를 추가할 수 있습니다." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: "admin" | "super_admin";
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const displayName = body.displayName?.trim() || "Admin";
    const role = body.role === "super_admin" ? "super_admin" : "admin";

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "이메일과 6자 이상 비밀번호가 필요합니다." },
        { status: 400 },
      );
    }

    const auth = getAdminAuth();
    let user;
    try {
      user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, {
        password,
        displayName,
        emailVerified: true,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/user-not-found") throw err;
      user = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
    }

    const ref = getAdminFirestore().collection("admins").doc(user.uid);
    const existing = await ref.get();
    await ref.set(
      {
        email,
        displayName,
        isApproved: true,
        role,
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );

    return NextResponse.json({ uid: user.uid, email, role });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "관리자 추가에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
