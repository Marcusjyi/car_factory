/** 한국 휴대폰 → E.164 (+82…) */
export function toE164Kr(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const raw = phone.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  if (digits.startsWith("82") && digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 11) {
    return `+82${digits.slice(1)}`;
  }
  return null;
}

/** +821012345678 → 010-****-5678 */
export function maskPhoneKr(phone: string | undefined | null): string {
  const e164 = toE164Kr(phone);
  if (!e164) return "미등록";
  const local = e164.replace(/^\+82/, "0");
  if (local.length < 10) return local;
  return `${local.slice(0, 3)}-****-${local.slice(-4)}`;
}
