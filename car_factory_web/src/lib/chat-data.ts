import { PRODUCTS } from "@/lib/mock-data";

export type ChatStatus = "active" | "completed";

export type ChatMessage = {
  id: string;
  sender: "me" | "seller";
  text: string;
  time: string;
};

export type ChatRoom = {
  id: string;
  sellerName: string;
  product: (typeof PRODUCTS)[number];
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: ChatStatus;
  messages: ChatMessage[];
};

export const CHAT_ROOMS: ChatRoom[] = [
  {
    id: "r1",
    sellerName: "카팩토리_서울",
    product: PRODUCTS[0],
    lastMessage: "네, 헤드라이트 정상 작동 확인했습니다.",
    lastTime: "14:32",
    unread: 2,
    status: "active",
    messages: [
      {
        id: "m1",
        sender: "me",
        text: "안녕하세요, BMW F10 헤드라이트 아직 판매 중인가요?",
        time: "14:20",
      },
      {
        id: "m2",
        sender: "seller",
        text: "안녕하세요! 네, 현재 판매 중입니다. HID 타입 좌측 헤드라이트입니다.",
        time: "14:22",
      },
      {
        id: "m3",
        sender: "me",
        text: "작동 상태는 어떤가요? 스크래치 정도도 알려주실 수 있을까요?",
        time: "14:28",
      },
      {
        id: "m4",
        sender: "seller",
        text: "네, 헤드라이트 정상 작동 확인했습니다. 미세한 스크래치 있으나 클립 파손 없습니다.",
        time: "14:32",
      },
    ],
  },
  {
    id: "r2",
    sellerName: "파츠마스터",
    product: PRODUCTS[1],
    lastMessage: "배송 완료되었습니다. 감사합니다!",
    lastTime: "어제",
    unread: 0,
    status: "completed",
    messages: [
      {
        id: "m1",
        sender: "me",
        text: "사이드미러 배송 언제쯤 가능할까요?",
        time: "10:15",
      },
      {
        id: "m2",
        sender: "seller",
        text: "내일 오전 중 발송 예정입니다.",
        time: "10:20",
      },
      {
        id: "m3",
        sender: "seller",
        text: "배송 완료되었습니다. 감사합니다!",
        time: "어제",
      },
    ],
  },
  {
    id: "r3",
    sellerName: "인천파츠",
    product: PRODUCTS[2],
    lastMessage: "범퍼 도색 상태 사진 보내드릴게요.",
    lastTime: "11:05",
    unread: 1,
    status: "active",
    messages: [
      {
        id: "m1",
        sender: "me",
        text: "K5 DL3 범퍼 도색 상태가 궁금합니다.",
        time: "11:00",
      },
      {
        id: "m2",
        sender: "seller",
        text: "범퍼 도색 상태 사진 보내드릴게요.",
        time: "11:05",
      },
    ],
  },
];

export function getChatRoom(roomId: string) {
  return CHAT_ROOMS.find((room) => room.id === roomId) ?? CHAT_ROOMS[0];
}
