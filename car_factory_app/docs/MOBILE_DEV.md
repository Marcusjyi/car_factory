# CARFACTORY Flutter 앱 개발 노트

최종 갱신: 2026-08-06

위치: **`car_factory_app/`** (모노레포 `apps/mobile` 사용 안 함)

## 웹과의 계약

| 영역 | 웹 스토어 | Flutter |
|------|-----------|---------|
| users / products / orders / chatRooms | Firestore `default` | 동일 |
| 직거래 | `createDirectTrade` 등 | `TradeApi` |
| 채팅방 | `getOrCreateChatRoom` | `ChatApi` |
| 주문 write | Rules 거부 | 동일 — Functions만 |

## Firebase 체크리스트

- [x] Android 앱 등록 (`com.carfactory.car_factory_app`) + `android/app/google-services.json`
- [ ] Android SHA-1 / SHA-256 등록 (아래 표)
- [ ] iOS 앱 등록 (`com.carfactory.carFactoryApp`) + `GoogleService-Info.plist`
- [ ] Google Sign-In 동작 확인
- [ ] 카카오·네이버 (필요 시)

## Android 인증서 지문 (디버그)

| 종류 | 값 |
|------|-----|
| 패키지명 | `com.carfactory.car_factory_app` |
| SHA-1 | `F7:58:77:85:35:5B:E9:C5:4C:78:33:47:2C:97:DB:A9:93:75:CF:23` |
| SHA-256 | `78:92:27:99:EE:E6:48:4B:78:15:90:8E:F4:A5:D8:0C:05:A9:D0:DF:7F:A5:C6:61:66:07:13:DE:EA:9E:C1:C9` |

재확인:

```bash
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android
```

상세·주의사항은 [카팩토리 개발문서/05-앱별-구조.md](../../카팩토리%20개발문서/05-앱별-구조.md) Mobile 절 참고.

## 하지 말 것

- `orders` / `payments` / `chatRooms` 메타 클라이언트 쓰기
- 이메일/비밀번호 가입 UI
- `mechanic_admin` 수정
- keystore / 비밀번호를 git·개발문서에 커밋
