import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { verifyAdminRequestWithError } from "@/lib/auth/verify-admin";
import { getAdminBucket } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function publicDownloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
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

    const form = await request.formData();
    const partnerId = String(form.get("partnerId") ?? "").trim();
    const file = form.get("file");

    if (!/^[a-zA-Z0-9_-]{2,40}$/.test(partnerId)) {
      return NextResponse.json(
        { error: "지점 ID가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 },
      );
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, WEBP만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "이미지당 최대 10MB까지 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const photoPath = `partner-images/${partnerId}/${Date.now()}.${ext}`;
    const token = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = getAdminBucket();

    await bucket.file(photoPath).save(buffer, {
      resumable: false,
      metadata: {
        contentType: file.type,
        cacheControl: "public,max-age=31536000,immutable",
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    return NextResponse.json({
      photoURL: publicDownloadUrl(bucket.name, photoPath, token),
      photoPath,
    });
  } catch (err) {
    console.error("[partners/photo POST]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "사진 업로드에 실패했습니다. 서비스 계정 설정을 확인하세요.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { admin, error } = await verifyAdminRequestWithError(request);
    if (!admin) {
      return NextResponse.json(
        { error: error ?? "관리자 권한이 없습니다." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      photoPath?: string;
    } | null;
    const photoPath = String(body?.photoPath ?? "").trim();
    if (!photoPath.startsWith("partner-images/")) {
      return NextResponse.json(
        { error: "잘못된 경로입니다." },
        { status: 400 },
      );
    }

    try {
      await getAdminBucket().file(photoPath).delete({ ignoreNotFound: true });
    } catch {
      // ignore
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[partners/photo DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
