export const SITE_NAME = "CARFACTORY";
export const SITE_NAME_KO = "카팩토리";

/** 사업자등록증 기준 고시 정보 */
export const COMPANY_INFO = {
  name: "카팩토리",
  nameEn: "CARFACTORY",
  ceo: "김상범",
  businessNumber: "733-16-01338",
  address: "경기도 김포시 통진읍 월하로519번길 14",
  businessType: "서비스업",
  businessItem: "통신판매업",
  email: "car_factory@naver.com",
  privacyOfficer: "김상범",
} as const;

export type CategoryItem = {
  id: string;
  label: string;
};

export type CategoryGroup = {
  id: string;
  label: string;
  children: readonly CategoryItem[];
};

/** 대분류 → 중분류 */
export const CATEGORY_GROUPS = [
  {
    id: "exterior",
    label: "외장 부품",
    children: [
      { id: "bumper", label: "범퍼" },
      { id: "fender", label: "펜더" },
      { id: "hood", label: "본넷/후드" },
      { id: "door", label: "도어" },
      { id: "trunk", label: "트렁크/테일게이트" },
      { id: "mirror", label: "미러" },
      { id: "grille", label: "그릴" },
      { id: "molding", label: "몰딩/가니시" },
      { id: "exterior-other", label: "기타" },
    ],
  },
  {
    id: "lamp",
    label: "램프/시그널",
    children: [
      { id: "headlight", label: "헤드라이트" },
      { id: "taillight", label: "테일램프" },
      { id: "fog-light", label: "안개등" },
      { id: "turn-signal", label: "방향지시등" },
      { id: "drl", label: "DRL" },
      { id: "lamp-other", label: "기타" },
    ],
  },
  {
    id: "interior",
    label: "내장 부품",
    children: [
      { id: "seat", label: "시트" },
      { id: "dashboard", label: "대시보드" },
      { id: "steering-wheel", label: "핸들" },
      { id: "console", label: "콘솔" },
      { id: "door-trim", label: "도어트림" },
      { id: "cluster", label: "클러스터/계기판" },
      { id: "interior-other", label: "기타" },
    ],
  },
  {
    id: "engine",
    label: "엔진/흡기·배기",
    children: [
      { id: "engine-assy", label: "엔진앗세이" },
      { id: "cylinder-head", label: "실린더헤드" },
      { id: "injector", label: "인젝터" },
      { id: "turbo", label: "터보" },
      { id: "intake", label: "흡기매니폴드" },
      { id: "exhaust", label: "배기/머플러" },
      { id: "catalyst", label: "촉매" },
      { id: "engine-other", label: "기타" },
    ],
  },
  {
    id: "drivetrain",
    label: "미션/구동",
    children: [
      { id: "auto-mission", label: "오토미션" },
      { id: "manual-mission", label: "수동미션" },
      { id: "transfer", label: "트랜스퍼" },
      { id: "drive-shaft", label: "드라이브샤프트" },
      { id: "differential", label: "디퍼렌셜" },
      { id: "drivetrain-other", label: "기타" },
    ],
  },
  {
    id: "chassis",
    label: "하체/조향·제동",
    children: [
      { id: "shock", label: "쇼바/스트럿" },
      { id: "arm-knuckle", label: "암/너클" },
      { id: "hub", label: "휠허브" },
      { id: "steering", label: "스티어링" },
      { id: "brake", label: "브레이크" },
      { id: "chassis-other", label: "기타" },
    ],
  },
  {
    id: "cooling",
    label: "냉각/공조",
    children: [
      { id: "radiator", label: "라디에이터" },
      { id: "condenser", label: "콘덴서" },
      { id: "intercooler", label: "인터쿨러" },
      { id: "water-pump", label: "워터펌프" },
      { id: "ac-compressor", label: "에어컨컴프레서" },
      { id: "heater-core", label: "히터코어" },
      { id: "cooling-other", label: "기타" },
    ],
  },
  {
    id: "electrical",
    label: "전장/전자",
    children: [
      { id: "battery", label: "배터리" },
      { id: "alternator", label: "알터네이터" },
      { id: "starter", label: "스타트모터" },
      { id: "ecu", label: "ECU/모듈" },
      { id: "sensor", label: "센서" },
      { id: "wiring", label: "배선/퓨즈박스" },
      { id: "audio-navi", label: "오디오/내비게이션" },
      { id: "electrical-other", label: "기타" },
    ],
  },
  {
    id: "wheel",
    label: "휠/타이어",
    children: [
      { id: "alloy-wheel", label: "휠" },
      { id: "tire", label: "타이어" },
      { id: "tpms", label: "TPMS" },
      { id: "wheel-cap", label: "휠캡" },
      { id: "wheel-other", label: "기타" },
    ],
  },
  {
    id: "consumable",
    label: "소모품/기타",
    children: [
      { id: "filter", label: "필터류" },
      { id: "oil", label: "오일류" },
      { id: "belt", label: "벨트/체인" },
      { id: "consumable-other", label: "기타" },
    ],
  },
] as const satisfies readonly CategoryGroup[];

/** @deprecated 하위 호환 — 중분류 flat 목록 */
export const CATEGORIES = CATEGORY_GROUPS.flatMap((g) =>
  g.children.map((c) => ({ ...c, groupId: g.id, groupLabel: g.label })),
);

export function getCategoryGroup(groupId: string) {
  return CATEGORY_GROUPS.find((g) => g.id === groupId);
}

export function getSubCategory(subId: string) {
  return CATEGORIES.find((c) => c.id === subId);
}

export function getGroupBySubCategory(subId: string) {
  return CATEGORY_GROUPS.find((g) =>
    g.children.some((c) => c.id === subId),
  );
}

export function getSubCategoryIdsByGroup(groupId: string): string[] {
  return getCategoryGroup(groupId)?.children.map((c) => c.id) ?? [];
}

export const BRANDS = [
  { id: "hyundai", label: "현대" },
  { id: "kia", label: "기아" },
  { id: "genesis", label: "제네시스" },
  { id: "chevrolet", label: "쉐보레" },
  { id: "kgm", label: "KG모빌리티(쌍용)" },
  { id: "renault", label: "르노코리아" },
  { id: "bmw", label: "BMW" },
  { id: "benz", label: "벤츠" },
  { id: "audi", label: "아우디" },
  { id: "volkswagen", label: "폭스바겐" },
  { id: "porsche", label: "포르쉐" },
  { id: "mini", label: "미니" },
  { id: "volvo", label: "볼보" },
  { id: "jaguar", label: "재규어" },
  { id: "landrover", label: "랜드로버" },
  { id: "toyota", label: "토요타" },
  { id: "lexus", label: "렉서스" },
  { id: "honda", label: "혼다" },
  { id: "nissan", label: "닛산" },
  { id: "infiniti", label: "인피니티" },
  { id: "mazda", label: "마즈다" },
  { id: "subaru", label: "스바루" },
  { id: "mitsubishi", label: "미쓰비시" },
  { id: "suzuki", label: "스즈키" },
  { id: "ford", label: "포드" },
  { id: "lincoln", label: "링컨" },
  { id: "jeep", label: "지프" },
  { id: "chrysler", label: "크라이슬러" },
  { id: "cadillac", label: "캐딜락" },
  { id: "tesla", label: "테슬라" },
  { id: "peugeot", label: "푸조" },
  { id: "citroen", label: "시트로엥" },
  { id: "fiat", label: "피아트" },
  { id: "ferrari", label: "페라리" },
  { id: "lamborghini", label: "람보르기니" },
  { id: "maserati", label: "마세라티" },
  { id: "bentley", label: "벤틀리" },
  { id: "rollsroyce", label: "롤스로이스" },
  { id: "other", label: "기타" },
] as const;

export const MYPAGE_NAV = [
  { href: "/mypage", label: "대시보드", icon: "home" },
  { href: "/mypage/products", label: "내 상점 관리", icon: "store" },
  { href: "/mypage/orders", label: "거래 내역", icon: "history" },
  { href: "/favorites", label: "찜목록", icon: "heart" },
  { href: "/mypage/profile", label: "내 정보 관리", icon: "user" },
  { href: "/support", label: "고객센터", icon: "headset" },
] as const;

/** 대시보드 바로가기 (건수 표시 항목은 클라이언트에서 앞에 붙임) */
export const MYPAGE_QUICK_LINKS = [
  { href: "/mypage/orders", label: "거래 내역", icon: "history" },
  { href: "/mypage/profile", label: "내 정보 관리", icon: "user" },
  { href: "/support", label: "고객센터", icon: "headset" },
] as const;

export const SUPPORT_NAV = [
  { href: "/support", label: "공지사항", icon: "megaphone" },
  { href: "/support#faq", label: "FAQ", icon: "help" },
  { href: "/support/inquiries/new", label: "1:1 문의", icon: "message" },
  { href: "/support#shipping", label: "배송/결제 안내", icon: "truck" },
  { href: "/support#refund", label: "환불/교환 안내", icon: "refresh" },
  { href: "/support#terms", label: "이용약관", icon: "file" },
] as const;
