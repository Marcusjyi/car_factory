export const KST_TIMEZONE = "Asia/Seoul";

export function startOfTodayKST(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return new Date(`${year}-${month}-${day}T00:00:00+09:00`);
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed
        : null;
    } catch {
      // fall through
    }
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return null;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

/** 목록용 일시 — mechanic_admin `formatDate`와 동일 역할 */
export function formatDate(value: unknown) {
  const date = toDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(value: Date | null) {
  return formatDate(value);
}
