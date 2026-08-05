# CARFACTORY Flutter 앱 개발 노트

최종 갱신: 2026-08-04

위치: **`car_factory_app/`** (모노레포 `apps/mobile` 사용 안 함)

## 웹과의 계약

| 영역 | 웹 스토어 | Flutter |
|------|-----------|---------|
| users / products / orders / chatRooms | Firestore `default` | 동일 |
| 직거래 | `createDirectTrade` 등 | `TradeApi` |
| 채팅방 | `getOrCreateChatRoom` | `ChatApi` |
| 주문 write | Rules 거부 | 동일 — Functions만 |

## Firebase 체크리스트

- [ ] Android 앱 등록 (`com.carfactory.car_factory_app`)
- [ ] iOS 앱 등록 (`com.carfactory.carFactoryApp`)
- [ ] `flutterfire configure` (`car_factory_app`에서)
- [ ] Google Sign-In SHA-1 등록
- [ ] 카카오·네이버 (필요 시)

## 하지 말 것

- `orders` / `payments` / `chatRooms` 메타 클라이언트 쓰기
- 이메일/비밀번호 가입 UI
- `mechanic_admin` 수정
- `car_factory_web/apps` 아래에 mobile 재생성
