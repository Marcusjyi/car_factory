"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  updateUserAddress,
  updateUserDefaultTransferAccount,
  updateUserProfileBasics,
  updateUserShippingAddress,
} from "@/features/auth/user-repository";

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const inputClass =
  "h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </span>
      {children}
    </label>
  );
}

export function MyProfileClient() {
  const router = useRouter();
  const { status, user, firebaseUser, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [defaultRegion, setDefaultRegion] = useState("");

  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");

  const [shipRecipient, setShipRecipient] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipAddr1, setShipAddr1] = useState("");
  const [shipAddr2, setShipAddr2] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const syncFromUser = useCallback(() => {
    if (!user) return;
    setName(user.name ?? "");
    setDisplayName(user.displayName ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setDefaultRegion(user.defaultRegion ?? "");
    setAddr1(user.address?.address1 ?? "");
    setAddr2(user.address?.address2 ?? "");
    setShipRecipient(
      user.shippingAddress?.recipient ?? user.name ?? user.displayName ?? "",
    );
    setShipPhone(user.shippingAddress?.phone ?? user.phoneNumber ?? "");
    setShipAddr1(user.shippingAddress?.address1 ?? "");
    setShipAddr2(user.shippingAddress?.address2 ?? "");
    setBankName(user.defaultTransferAccount?.bankName ?? "");
    setAccountNumber(user.defaultTransferAccount?.accountNumber ?? "");
    setAccountHolder(user.defaultTransferAccount?.accountHolder ?? "");
  }, [user]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login?next=/mypage/profile");
      return;
    }
    syncFromUser();
    setLoading(false);
  }, [router, status, syncFromUser]);

  async function onSaveAll(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setError(null);
    setMessage(null);

    if (name.trim().length < 2) {
      setError("이름은 2자 이상이어야 합니다.");
      return;
    }
    if (displayName.trim().length < 2) {
      setError("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    const phone = phoneNumber.replace(/-/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phone)) {
      setError("휴대전화 번호를 확인해주세요.");
      return;
    }
    if (!defaultRegion) {
      setError("거래 지역을 선택해주세요.");
      return;
    }
    if (addr1.trim().length < 3) {
      setError("기본 주소를 입력해주세요.");
      return;
    }
    if (!shipRecipient.trim()) {
      setError("배송지 수령인을 입력해주세요.");
      return;
    }
    const shipPhoneNorm = shipPhone.replace(/-/g, "");
    if (!/^01[016789]\d{7,8}$/.test(shipPhoneNorm)) {
      setError("배송지 연락처를 확인해주세요.");
      return;
    }
    if (shipAddr1.trim().length < 3) {
      setError("배송지 기본 주소를 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfileBasics(firebaseUser.uid, {
        name,
        displayName,
        phoneNumber: phone,
        defaultRegion,
      });
      await updateUserAddress(firebaseUser.uid, {
        address1: addr1,
        address2: addr2,
      });
      await updateUserShippingAddress(firebaseUser.uid, {
        label: "기본",
        recipient: shipRecipient,
        phone: shipPhoneNorm,
        address1: shipAddr1,
        address2: shipAddr2,
      });
      const hasAnyBank = Boolean(
        bankName.trim() || accountNumber.trim() || accountHolder.trim(),
      );
      if (hasAnyBank) {
        await updateUserDefaultTransferAccount(firebaseUser.uid, {
          bankName,
          accountNumber,
          accountHolder,
        });
      } else {
        await updateUserDefaultTransferAccount(firebaseUser.uid, null);
      }
      await refreshUser();
      setMessage("회원 정보가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 rounded-[12px] border border-border bg-white py-16 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" />
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <form
        id="profile"
        onSubmit={(e) => void onSaveAll(e)}
        className="rounded-[12px] border border-border bg-white p-5 md:p-6"
      >
        <section id="address">
          <h2 className="text-base font-bold text-text">기본 정보</h2>
          <div className="mt-4 space-y-4">
            <Field label="이름">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="예: 김카팩"
              />
            </Field>
            <Field label="닉네임">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="예: 카팩마스터"
              />
            </Field>
            <Field label="휴대전화">
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={inputClass}
                inputMode="tel"
                placeholder="01012345678"
              />
            </Field>
            <Field label="거래 지역">
              <select
                value={defaultRegion}
                onChange={(e) => setDefaultRegion(e.target.value)}
                className={inputClass}
              >
                <option value="">지역 선택</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="주소">
              <input
                value={addr1}
                onChange={(e) => setAddr1(e.target.value)}
                className={inputClass}
                placeholder="도로명 또는 지번 주소"
              />
            </Field>
            <Field label="상세 주소">
              <input
                value={addr2}
                onChange={(e) => setAddr2(e.target.value)}
                className={inputClass}
                placeholder="동·호수 등 (선택)"
              />
            </Field>
          </div>
        </section>

        <section id="shipping" className="mt-8 border-t border-border pt-6">
          <h2 className="text-base font-bold text-text">배송지</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            주문 상품이 배송될 주소입니다. 기본 정보 주소와는 별도로 저장됩니다.
          </p>
          <div className="mt-4 space-y-4">
            <Field label="수령인">
              <input
                value={shipRecipient}
                onChange={(e) => setShipRecipient(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="연락처">
              <input
                value={shipPhone}
                onChange={(e) => setShipPhone(e.target.value)}
                className={inputClass}
                inputMode="tel"
                placeholder="01012345678"
              />
            </Field>
            <Field label="주소">
              <input
                value={shipAddr1}
                onChange={(e) => setShipAddr1(e.target.value)}
                className={inputClass}
                placeholder="도로명 또는 지번 주소"
              />
            </Field>
            <Field label="상세 주소">
              <input
                value={shipAddr2}
                onChange={(e) => setShipAddr2(e.target.value)}
                className={inputClass}
                placeholder="동·호수 등 (선택)"
              />
            </Field>
          </div>
        </section>

        <section id="transfer" className="mt-8 border-t border-border pt-6">
          <h2 className="text-base font-bold text-text">직거래 기본 계좌</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            계좌이체 거래 시 자동으로 채워집니다. 비워 두면 거래마다 직접
            입력합니다.
          </p>
          <div className="mt-4 space-y-4">
            <Field label="은행명">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={inputClass}
                placeholder="예: 국민은행"
              />
            </Field>
            <Field label="계좌번호">
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={inputClass}
                placeholder="숫자만 입력"
                inputMode="numeric"
              />
            </Field>
            <Field label="예금주">
              <input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className={inputClass}
                placeholder="예금주 성명"
              />
            </Field>
          </div>
        </section>

        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            저장하기
          </button>
        </div>
      </form>
    </div>
  );
}
