export type Installer = {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  specialties: string[];
  hours: string;
  description: string;
  image: string;
};

export const INSTALLERS: Installer[] = [
  {
    id: "g1",
    name: "카팩토리 김포점",
    region: "경기 김포",
    address: "경기도 김포시 통진읍 월하로 120",
    phone: "031-123-4567",
    specialties: ["외장 부품", "램프", "범퍼"],
    hours: "평일 09:00–18:00 / 토 09:00–14:00",
    description:
      "카팩토리에서 구매한 외장·램프 부품 장착을 전문으로 합니다. 사전 예약 후 방문해 주세요.",
    image:
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&q=80",
  },
  {
    id: "g2",
    name: "카팩토리 강남점",
    region: "서울 강남",
    address: "서울특별시 강남구 테헤란로 88",
    phone: "02-555-0199",
    specialties: ["엔진", "하체", "브레이크"],
    hours: "평일 10:00–19:00 / 토 10:00–15:00",
    description:
      "엔진·하체 계열 장착과 간단 점검을 함께 진행합니다. 부품 수령 후 방문 장착 가능합니다.",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  },
  {
    id: "g3",
    name: "카팩토리 수원점",
    region: "경기 수원",
    address: "경기도 수원시 권선구 권선로 210",
    phone: "031-222-7788",
    specialties: ["미러", "휠", "내장"],
    hours: "평일 09:00–18:00",
    description:
      "미러·휠·내장 트림 교체에 특화되어 있습니다. 카팩토리 주문번호 제시 시 상담이 빨라집니다.",
    image:
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
  },
  {
    id: "g4",
    name: "카팩토리 해운대점",
    region: "부산 해운대",
    address: "부산광역시 해운대구 센텀동로 45",
    phone: "051-700-3344",
    specialties: ["냉각/공조", "전장", "센서"],
    hours: "평일 09:00–18:00 / 일 휴무",
    description:
      "라디에이터·공조·전장 모듈 장착을 담당합니다. 호환 확인이 필요한 부품도 사전 상담합니다.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    id: "g5",
    name: "카팩토리 남동점",
    region: "인천 남동",
    address: "인천광역시 남동구 인주대로 550",
    phone: "032-440-8890",
    specialties: ["범퍼", "도어", "그릴"],
    hours: "평일 08:30–17:30 / 토 예약제",
    description:
      "판금 없이 순정 부품 교환 위주로 작업합니다. 카팩토리 구매 부품 장착 대행을 안내합니다.",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
  },
  {
    id: "g6",
    name: "카팩토리 일산점",
    region: "경기 고양",
    address: "경기도 고양시 일산동구 중앙로 1230",
    phone: "031-910-2200",
    specialties: ["램프", "미러", "외장"],
    hours: "평일 09:00–18:00 / 토 09:00–13:00",
    description:
      "일산·파주 권역 고객을 위한 장착 대행점입니다. 외장·램프 교체를 빠르게 진행합니다.",
    image:
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&q=80",
  },
  {
    id: "g7",
    name: "카팩토리 의정부점",
    region: "경기 의정부",
    address: "경기도 의정부시 평화로 520",
    phone: "031-870-4455",
    specialties: ["브레이크", "하체", "휠"],
    hours: "평일 09:00–18:00 / 토 예약제",
    description:
      "의정부·양주 권역 장착을 담당합니다. 브레이크·하체 부품 장착에 특화되어 있습니다.",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  },
  {
    id: "g8",
    name: "카팩토리 분당점",
    region: "경기 성남",
    address: "경기도 성남시 분당구 판교로 242",
    phone: "031-708-3311",
    specialties: ["전장", "센서", "내장"],
    hours: "평일 10:00–19:00 / 토 10:00–14:00",
    description:
      "분당·판교 권역 고객을 위한 장착점입니다. 전장·센서 모듈 장착을 꼼꼼히 점검합니다.",
    image:
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
  },
  {
    id: "g9",
    name: "카팩토리 부천점",
    region: "경기 부천",
    address: "경기도 부천시 원미구 길주로 210",
    phone: "032-320-6677",
    specialties: ["범퍼", "도어", "냉각/공조"],
    hours: "평일 09:00–18:00",
    description:
      "부천·광명 권역 장착 대행을 안내합니다. 범퍼·도어·공조 부품 교체가 가능합니다.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    id: "g10",
    name: "카팩토리 송파점",
    region: "서울 송파",
    address: "서울특별시 송파구 올림픽로 300",
    phone: "02-414-8890",
    specialties: ["엔진", "미션", "휠"],
    hours: "평일 09:00–18:00 / 토 09:00–15:00",
    description:
      "송파·잠실 권역 장착을 담당합니다. 엔진·미션·휠 관련 부품 장착을 지원합니다.",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
  },
];

export function getInstallerById(id: string) {
  return INSTALLERS.find((shop) => shop.id === id) ?? null;
}
