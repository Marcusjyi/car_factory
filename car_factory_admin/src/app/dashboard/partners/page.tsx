"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  EmailAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  reauthenticateWithCredential,
} from "firebase/auth";
import { Card, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callDeletePartner, getClientAuth } from "@/lib/firebase/config";
import { listPartners } from "@/lib/firestore/client";
import { useAuth } from "@/lib/auth/auth-context";
import { maskPhoneKr, toE164Kr } from "@/lib/utils/phone";
import type { Partner } from "@/lib/types";

function formatAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  const rawMessage =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : "";

  if (
    code === "auth/wrong-password" ||
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials"
  ) {
    return "비밀번호가 올바르지 않습니다.";
  }
  if (code === "auth/invalid-verification-code") {
    return "인증번호가 올바르지 않습니다.";
  }
  if (code === "auth/code-expired") {
    return "인증번호가 만료되었습니다. 다시 받아 주세요.";
  }
  if (code === "auth/too-many-requests") {
    return "시도가 너무 많습니다. 잠시 후 다시 시도하세요.";
  }
  if (code === "auth/credential-already-in-use") {
    return "이미 다른 계정에 연결된 휴대폰입니다.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Firebase Console → Authentication → Phone 로그인을 활성화하세요.";
  }
  if (code === "auth/invalid-app-credential") {
    return "Phone Auth는 localhost에서 막혀 있습니다. 주소창을 http://127.0.0.1:포트 로 열고, Firebase Console → Authentication → 설정 → 승인된 도메인에 127.0.0.1 을 추가하세요.";
  }
  if (
    /Database is closing\/hidden/i.test(rawMessage) ||
    /Database is closing\/hidden/i.test(String(err))
  ) {
    return "브라우저 포커스 문제로 인증이 중단되었습니다. 탭을 그대로 두고 다시 시도하거나, 페이지를 새로고침하세요.";
  }
  if (code === "auth/invalid-phone-number") {
    return "등록된 휴대폰 번호 형식이 올바르지 않습니다. (+82…)";
  }
  if (
    code === "auth/quota-exceeded" ||
    code === "auth/billing-not-enabled" ||
    /BILLING_NOT_ENABLED/i.test(rawMessage)
  ) {
    return "실SMS는 Blaze(결제) 플랜이 필요합니다. Firebase 프로젝트 요금제를 확인하세요.";
  }
  if (
    /region/i.test(rawMessage) ||
    /SMS unable to be sent until this region/i.test(rawMessage)
  ) {
    return "Authentication → Settings → SMS region policy에서 한국(KR) 발송을 허용하세요.";
  }
  if (code === "auth/missing-phone-number") {
    return "휴대폰 번호가 없습니다.";
  }

  const cleaned = rawMessage
    .replace(/^Firebase:\s*/i, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .trim();
  if (cleaned) return cleaned;
  return code ? `인증 실패 (${code})` : "삭제에 실패했습니다.";
}

function DeletePartnerModal({
  partner,
  open,
  onClose,
  onDeleted,
  phoneNumber,
}: {
  partner: Partner | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  phoneNumber?: string;
}) {
  const titleId = useId();
  /** Firebase RecaptchaVerifier는 안정적인 DOM id가 필요 (React useId 비권장) */
  const recaptchaId = "cf-delete-partner-recaptcha";
  const { adminUser } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const verificationIdRef = useRef<string | null>(null);

  const phoneE164 = toE164Kr(phoneNumber || adminUser?.phoneNumber);
  const phoneMasked = maskPhoneKr(phoneNumber || adminUser?.phoneNumber);
  const busyRef = useRef(false);
  busyRef.current = busy || sendingOtp;

  useEffect(() => {
    setIsLocalhost(window.location.hostname === "localhost");
  }, []);

  // 모달 열릴 때만 폼 리셋. busy/sendingOtp를 deps에 넣으면
  // 인증번호 요청 중 verifier·입력이 같이 날아감.
  useEffect(() => {
    if (!open) return;
    setEmployeeId("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
    setError(null);
    setBusy(false);
    setSendingOtp(false);
    verificationIdRef.current = null;

    return () => {
      try {
        verifierRef.current?.clear();
      } catch {
        // ignore
      }
      verifierRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  async function createInvisibleVerifier() {
    const el = document.getElementById(recaptchaId);
    if (!el) {
      throw new Error("보안 확인 영역을 준비하지 못했습니다.");
    }
    try {
      verifierRef.current?.clear();
    } catch {
      // ignore
    }
    verifierRef.current = null;
    el.replaceChildren();
    const verifier = new RecaptchaVerifier(getClientAuth(), recaptchaId, {
      size: "invisible",
      callback: () => setError(null),
      "expired-callback": () => {
        setError("보안 확인이 만료되었습니다. 인증번호를 다시 받아 주세요.");
      },
    });
    verifierRef.current = verifier;
    await verifier.render();
    return verifier;
  }

  async function ensureVerifier() {
    if (verifierRef.current) return verifierRef.current;
    return createInvisibleVerifier();
  }

  async function sendOtp() {
    setError(null);
    if (!phoneE164) {
      setError(
        "등록된 휴대폰이 없습니다. admins.phoneNumber를 설정하거나 create-admin에 번호를 넣으세요.",
      );
      return;
    }
    const id = employeeId.trim();
    if (!id) {
      setError("사번을 입력하세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력하세요.");
      return;
    }

    const user = getClientAuth().currentUser;
    const email = user?.email || adminUser?.email;
    if (!user || !email) {
      setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    setSendingOtp(true);
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(email, password),
      );
      await user.getIdToken(true);

      const verifier = await ensureVerifier();
      const provider = new PhoneAuthProvider(getClientAuth());
      const verificationId = await provider.verifyPhoneNumber(
        phoneE164,
        verifier,
      );
      verificationIdRef.current = verificationId;
      setOtpSent(true);
      setOtp("");
    } catch (err) {
      try {
        verifierRef.current?.clear();
      } catch {
        // ignore
      }
      verifierRef.current = null;
      setError(formatAuthError(err));
      try {
        await createInvisibleVerifier();
      } catch {
        // ignore remount failure
      }
    } finally {
      setSendingOtp(false);
    }
  }

  async function onConfirm() {
    if (!partner) return;
    const id = employeeId.trim();
    if (!id) {
      setError("사번을 입력하세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력하세요.");
      return;
    }
    if (!otpSent || !verificationIdRef.current) {
      setError("먼저 인증번호를 받아 주세요.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("인증번호 6자리를 입력하세요.");
      return;
    }

    const user = getClientAuth().currentUser;
    if (!user) {
      setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const phoneCred = PhoneAuthProvider.credential(
        verificationIdRef.current,
        otp.trim(),
      );
      const hasPhone = user.providerData.some((p) => p.providerId === "phone");
      if (hasPhone) {
        await reauthenticateWithCredential(user, phoneCred);
      } else {
        try {
          await linkWithCredential(user, phoneCred);
        } catch (err) {
          const code =
            err && typeof err === "object" && "code" in err
              ? String((err as { code?: string }).code)
              : "";
          if (code === "auth/provider-already-linked") {
            await reauthenticateWithCredential(user, phoneCred);
          } else {
            throw err;
          }
        }
      }
      await user.getIdToken(true);
      await callDeletePartner(partner.id, id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open || !partner) return null;

  const locked = busy || sendingOtp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-[2px]"
        disabled={locked}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      >
        <div className="border-b border-[#F0F0F0] px-6 pb-4 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-red-500">
            영구 삭제
          </p>
          <h2
            id={titleId}
            className="mt-1 text-lg font-semibold tracking-tight text-[#2C2C2C]"
          >
            지점을 삭제할까요?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">
            <span className="font-medium text-[#2C2C2C]">
              {partner.name || partner.id}
            </span>
            을(를) 삭제하려면 본인 확인이 필요합니다.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {isLocalhost ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
              localhost에서는 SMS가 막힙니다.{" "}
              <span className="font-semibold">http://127.0.0.1:3001</span> 로
              접속하고 승인된 도메인에{" "}
              <span className="font-semibold">127.0.0.1</span> 을 추가하세요.
            </p>
          ) : null}

          <Input
            label="사번"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="예: 000001"
            name="cf-employee-id"
            autoComplete="off"
            disabled={locked}
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="로그인 비밀번호"
            autoComplete="current-password"
            disabled={locked}
          />

          <div className="rounded-xl bg-[#FAFAFA] px-3.5 py-3.5">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-[#2C2C2C]">휴대폰 인증</p>
              <p className="text-xs text-[#9CA3AF]">{phoneMasked}</p>
            </div>
            <div className="flex gap-2">
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={otpSent ? "인증번호 6자리" : "받기 후 입력"}
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={locked || !otpSent}
                className="min-w-0 flex-1 rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-center text-base font-semibold tracking-[0.35em] text-[#2C2C2C] outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-[#B0B0B0] focus:border-[#464646] disabled:bg-[#F5F5F5]"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 whitespace-nowrap px-3.5"
                disabled={locked}
                onClick={() => void sendOtp()}
              >
                {sendingOtp ? "전송 중…" : otpSent ? "재전송" : "인증번호 받기"}
              </Button>
            </div>
            {otpSent ? (
              <p className="mt-2 text-xs text-[#6B7280]">
                문자로 받은 6자리 번호를 입력한 뒤 삭제를 누르세요.
              </p>
            ) : (
              <p className="mt-2 text-xs text-[#9CA3AF]">
                등록된 번호로 인증 문자가 발송됩니다.
              </p>
            )}
          </div>

          {/* invisible reCAPTCHA — 체크박스 없이 백그라운드 검증 */}
          <div id={recaptchaId} />

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm leading-relaxed text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#F0F0F0] bg-[#FCFCFC] px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            disabled={locked}
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={locked}
            onClick={() => void onConfirm()}
          >
            {busy ? "삭제 중…" : "삭제"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const { adminUser } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setPartners(await listPartners());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "파트너 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="파트너스"
        description="장착 대행점 사진·주소·전문분야·뱃지를 관리합니다."
        action={
          <Link
            href="/dashboard/partners/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#464646] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#333]"
          >
            지점 추가
          </Link>
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-medium">사진</th>
                <th className="px-4 py-3 font-medium">지점</th>
                <th className="px-4 py-3 font-medium">주소</th>
                <th className="px-4 py-3 font-medium">전문분야</th>
                <th className="px-4 py-3 font-medium">노출</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#9CA3AF]"
                  >
                    불러오는 중…
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#9CA3AF]"
                  >
                    등록된 파트너가 없습니다. 「지점 추가」로 등록하세요.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3">
                      {p.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoURL}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover bg-[#F0F0F0]"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-[#F0F0F0]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#464646]">
                        {p.name || p.id}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{p.region}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[#6B7280]">
                      {p.address || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {p.specialties.length
                        ? p.specialties.join(" · ")
                        : p.specialtyLabel || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <Badge variant="success">웹·앱</Badge>
                      ) : (
                        <Badge>비공개</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/dashboard/partners/${p.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-[#F4F4F4] px-3 py-1.5 text-xs font-semibold text-[#464646] transition hover:bg-[#E8E8E8]"
                        >
                          수정
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          onClick={() => setDeleteTarget(p)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DeletePartnerModal
        partner={deleteTarget}
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void reload()}
        phoneNumber={adminUser?.phoneNumber}
      />
    </div>
  );
}
