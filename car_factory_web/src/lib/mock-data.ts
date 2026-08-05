export type Product = {
  id: string;
  title: string;
  price: number;
  /** 목록·카드용 (list WebP) */
  image: string;
  /** 소형 미리보기 (thumb WebP) — 장바구니 모달 등 */
  thumbImage?: string;
  /** 상세 갤러리용 (detail) */
  images?: string[];
  location: string;
  timeAgo: string;
  condition: string;
  yearRange: string;
  partNumber: string;
  listingNumber?: string;
  views: number;
  registeredAt: string;
  /** 목록 배지용 (selling | reserved | sold …) */
  listingStatus?: string;
  seller: {
    name: string;
    rating: number;
    reviewCount: number;
  };
  description: string;
  categoryId: string;
  brand: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "BMW 5시리즈 F10 헤드라이트 좌측 (HID)",
    price: 150000,
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
    ],
    location: "서울 강남구",
    timeAgo: "14분 전",
    condition: "중고 (A급)",
    yearRange: "2011-2013",
    partNumber: "63117203237",
    views: 128,
    registeredAt: "2024.05.20",
    seller: { name: "카팩토리_서울", rating: 98, reviewCount: 132 },
    description:
      "BMW 5시리즈 F10 (2011-2013) 순정 좌측(운전석) 헤드라이트입니다. HID 타입이며 정상 작동을 확인했습니다. 미세한 스크래치가 있으나 깨짐 파손 없습니다.",
    categoryId: "headlight",
    brand: "bmw",
  },
  {
    id: "p2",
    title: "현대 쏘나타 DN8 사이드미러 우측",
    price: 85000,
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c43e?w=800&q=80",
    location: "경기 수원시 권선구",
    timeAgo: "1시간 전",
    condition: "중고 (B급)",
    yearRange: "2019-2022",
    partNumber: "87620-L2000",
    views: 64,
    registeredAt: "2024.05.19",
    seller: { name: "파츠마스터", rating: 96, reviewCount: 88 },
    description: "쏘나타 DN8 우측 사이드미러. 접이식 정상, 배선 정상.",
    categoryId: "mirror",
    brand: "hyundai",
  },
  {
    id: "p2b",
    title: "기아 K5 DL3 사이드미러 좌측",
    price: 92000,
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    location: "서울 송파구",
    timeAgo: "3시간 전",
    condition: "중고 (A급)",
    yearRange: "2020-2023",
    partNumber: "87610-L1000",
    views: 41,
    registeredAt: "2024.05.19",
    seller: { name: "인천파츠", rating: 99, reviewCount: 210 },
    description: "기아 K5 DL3 좌측 사이드미러. 배선·접이식 정상.",
    categoryId: "mirror",
    brand: "kia",
  },
  {
    id: "p2c",
    title: "BMW 3시리즈 F30 사이드미러 우측",
    price: 180000,
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    location: "부산 해운대구",
    timeAgo: "5시간 전",
    condition: "중고 (A급)",
    yearRange: "2012-2018",
    partNumber: "51167294126",
    views: 77,
    registeredAt: "2024.05.18",
    seller: { name: "카팩토리_서울", rating: 98, reviewCount: 132 },
    description: "BMW F30 우측 사이드미러. 열선·접이식 정상.",
    categoryId: "mirror",
    brand: "bmw",
  },
  {
    id: "p2d",
    title: "현대 아반떼 AD 사이드미러 좌측",
    price: 78000,
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    location: "인천 남동구",
    timeAgo: "8시간 전",
    condition: "중고 (B급)",
    yearRange: "2016-2020",
    partNumber: "87610-G2000",
    views: 29,
    registeredAt: "2024.05.17",
    seller: { name: "부품창고", rating: 93, reviewCount: 29 },
    description: "아반떼 AD 좌측 사이드미러. 외관 생활기스 있음.",
    categoryId: "mirror",
    brand: "hyundai",
  },
  {
    id: "p3",
    title: "기아 K5 DL3 프론트 범퍼",
    price: 220000,
    image:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80",
    location: "서울 송파구",
    timeAgo: "어제",
    condition: "중고 (A급)",
    yearRange: "2020-2023",
    partNumber: "86511-L1000",
    views: 91,
    registeredAt: "2024.05.18",
    seller: { name: "인천파츠", rating: 99, reviewCount: 210 },
    description: "K5 DL3 순정 프론트 범퍼. 도색 상태 양호, 크랙 없음.",
    categoryId: "bumper",
    brand: "kia",
  },
  {
    id: "p4",
    title: "벤츠 E클래스 W213 라디에이터",
    price: 180000,
    image:
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
    location: "경기 성남시",
    timeAgo: "어제",
    condition: "중고 (A급)",
    yearRange: "2016-2020",
    partNumber: "A2135000103",
    views: 45,
    registeredAt: "2024.05.17",
    seller: { name: "벤츠파츠", rating: 97, reviewCount: 56 },
    description: "W213 라디에이터. 누수 없음, 핀 손상 없음.",
    categoryId: "radiator",
    brand: "benz",
  },
  {
    id: "p5",
    title: "아우디 A6 C7 브레이크 캘리퍼 세트",
    price: 65000,
    image:
      "https://images.unsplash.com/photo-1487756166181-9d25ea834a0b?w=800&q=80",
    location: "대구 수성구",
    timeAgo: "2일 전",
    condition: "중고 (B급)",
    yearRange: "2011-2018",
    partNumber: "4G0698151",
    views: 33,
    registeredAt: "2024.05.16",
    seller: { name: "대구오토", rating: 95, reviewCount: 41 },
    description: "A6 C7 전륬 캘리퍼. 피스톤 작동 확인.",
    categoryId: "brake",
    brand: "audi",
  },
  {
    id: "p6",
    title: "BMW 3시리즈 F30 18인치 휠 4개",
    price: 320000,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    location: "서울 강서구",
    timeAgo: "2일 전",
    condition: "중고 (A급)",
    yearRange: "2012-2018",
    partNumber: "36116792249",
    views: 156,
    registeredAt: "2024.05.15",
    seller: { name: "휠스토어", rating: 94, reviewCount: 73 },
    description: "F30 순정 18인치 알로이 휠 4본. 기스 적음.",
    categoryId: "alloy-wheel",
    brand: "bmw",
  },
  {
    id: "p7",
    title: "현대 아반떼 AD 앞 쇶바",
    price: 95000,
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c43e?w=600&q=80",
    location: "인천 남동구",
    timeAgo: "3일 전",
    condition: "중고 (B급)",
    yearRange: "2016-2020",
    partNumber: "54660-G2000",
    views: 22,
    registeredAt: "2024.05.14",
    seller: { name: "부품창고", rating: 93, reviewCount: 29 },
    description: "아반떼 AD 전륬 쇶바. 오일 누유 없음.",
    categoryId: "shock",
    brand: "hyundai",
  },
  {
    id: "p8",
    title: "기아 쏘렌토 MQ4 ECU 모듈",
    price: 280000,
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80",
    location: "경기 고양시",
    timeAgo: "3일 전",
    condition: "중고 (A급)",
    yearRange: "2020-2024",
    partNumber: "39100-R0000",
    views: 18,
    registeredAt: "2024.05.13",
    seller: { name: "전장파츠", rating: 97, reviewCount: 64 },
    description: "쏘렌토 MQ4 ECU. 정상 작동 확인. 코딩 필요 시 별도 문의.",
    categoryId: "ecu",
    brand: "kia",
  },
];

export const CART_ITEMS = PRODUCTS.slice(0, 5).map((p, i) => ({
  ...p,
  quantity: 1,
  shippingMethod: i === 4 ? "화물택배" : "택배",
  shippingFee: i === 4 ? 35000 : 3000,
  selected: true,
}));

export const FEATURES = [
  {
    title: "부품 검색",
    desc: "상세검색으로 필요한 부품을 찾으세요",
    icon: "search" as const,
  },
  {
    title: "판매자 채팅",
    desc: "상태·호환 여부를 1:1로 바로 확인",
    icon: "chat" as const,
  },
  {
    title: "직거래",
    desc: "만나서 결제 또는 계좌이체로 거래",
    icon: "shield" as const,
  },
  {
    title: "택배·직거래",
    desc: "판매자와 맞춰 원하는 방식으로 거래",
    icon: "truck" as const,
  },
];
