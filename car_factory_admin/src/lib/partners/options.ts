/** 파트너스 편집용 선택지 */

export const PARTNER_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);

export const PARTNER_MINUTE_OPTIONS = ["00", "30"] as const;

export const PARTNER_HOLIDAY_MODE_OPTIONS = ["휴무", "예약제", "운영"] as const;

export type HolidayMode = (typeof PARTNER_HOLIDAY_MODE_OPTIONS)[number];

export type TimeHM = { hour: string; minute: string };

export type HoursState = {
  weekdayOpen: TimeHM;
  weekdayClose: TimeHM;
  holidayMode: HolidayMode;
  holidayOpen: TimeHM;
  holidayClose: TimeHM;
};

export const DEFAULT_HOURS_STATE: HoursState = {
  weekdayOpen: { hour: "09", minute: "00" },
  weekdayClose: { hour: "18", minute: "00" },
  holidayMode: "휴무",
  holidayOpen: { hour: "10", minute: "00" },
  holidayClose: { hour: "15", minute: "00" },
};

export function formatTimeHM(t: TimeHM): string {
  return `${t.hour}:${t.minute}`;
}

export function formatTimeRange(open: TimeHM, close: TimeHM): string {
  return `${formatTimeHM(open)}–${formatTimeHM(close)}`;
}

export function formatPartnerHours(state: HoursState): string {
  const weekday = formatTimeRange(state.weekdayOpen, state.weekdayClose);
  const holiday =
    state.holidayMode === "운영"
      ? formatTimeRange(state.holidayOpen, state.holidayClose)
      : state.holidayMode;
  return `평일 ${weekday} / 휴일·공휴일 ${holiday}`;
}

function parseHM(token: string | undefined, fallback: TimeHM): TimeHM {
  const m = token?.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const hour = String(Number(m[1])).padStart(2, "0");
  const minuteNum = Number(m[2]);
  const minute = minuteNum >= 30 ? "30" : "00";
  return { hour, minute };
}

function parseRange(
  raw: string,
  openFb: TimeHM,
  closeFb: TimeHM,
): { open: TimeHM; close: TimeHM } | null {
  const m = raw.match(/(\d{1,2}:\d{2})\s*[–\-~]\s*(\d{1,2}:\d{2})/);
  if (!m) return null;
  return {
    open: parseHM(m[1], openFb),
    close: parseHM(m[2], closeFb),
  };
}

/** 저장된 hours 문자열 → 휠 상태 */
export function parsePartnerHours(raw: string): HoursState {
  const defaults = { ...DEFAULT_HOURS_STATE };
  const text = raw.trim();
  if (!text) return defaults;

  const parts = text.split(/\s*\/\s*/);
  const weekdayRaw = (parts[0] ?? "").replace(/^평일\s*/, "").trim();
  const weekdayRange = parseRange(
    weekdayRaw,
    defaults.weekdayOpen,
    defaults.weekdayClose,
  );
  if (weekdayRange) {
    defaults.weekdayOpen = weekdayRange.open;
    defaults.weekdayClose = weekdayRange.close;
  }

  if (parts[1]) {
    const holiday = parts[1]
      .replace(/^휴일·공휴일\s*/, "")
      .replace(/^토\s*/, "")
      .replace(/^일\s*/, "")
      .trim();
    if (/휴무/.test(holiday)) {
      defaults.holidayMode = "휴무";
    } else if (/예약제/.test(holiday)) {
      defaults.holidayMode = "예약제";
    } else {
      const range = parseRange(
        holiday,
        defaults.holidayOpen,
        defaults.holidayClose,
      );
      if (range) {
        defaults.holidayMode = "운영";
        defaults.holidayOpen = range.open;
        defaults.holidayClose = range.close;
      }
    }
  }

  return defaults;
}

export const PARTNER_SPECIALTY_OPTIONS = [
  "수입차",
  "국산차",
  "튜닝",
  "엔진",
  "미션",
  "하체",
  "외장",
  "휠",
  "공조기",
  "전장",
  "센서",
] as const;

export const PARTNER_BADGE_OPTIONS = [
  "당일 예약 가능",
  "보증 서비스",
  "예약제",
  "주말 운영",
  "주차 가능",
  "픽업 지원",
] as const;
