# `admins/{uid}` 스키마

관리자 계정은 **CLI로만 생성**한다.  
어드민 앱에 관리자 목록/추가 화면은 없다.

컬렉션: Firestore named DB `default` → `admins/{uid}`  
문서 ID = Firebase Auth UID  
비밀번호는 Firestore에 저장하지 않는다. Authentication(이메일/비밀번호)만 사용한다.

## 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | string | O | 로그인 이메일 (소문자) |
| `displayName` | string | O | 표시 이름 |
| `employeeId` | string | X | 사번 |
| `phoneNumber` | string | X | 휴대폰 E.164 (`+8210…`) — 삭제 시 SMS 인증 |
| `isApproved` | boolean | O | `true`여야 어드민 로그인 가능 |
| `role` | `"admin"` \| `"super_admin"` | O | 권한 |
| `createdAt` | timestamp | O | 생성 |
| `updatedAt` | timestamp | O | 수정 |

클라이언트 직접 쓰기 금지.

## CLI

스크립트: `car_factory_admin/scripts/create-admin.cjs`

문서 폴더·스토어·워크스페이스 루트에 두지 않는다.

Firebase Console → Authentication → **Email/Password** 활성화.

인증 (하나):

1. `car_factory_admin/.env.local` 또는 `car_factory_web/.env.local`  
   `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
2. `service-account.json`  
   `car_factory_admin/` 또는 `car_factory_web/`

```bash
cd car_factory_admin
npm run create-admin -- admin@example.com "<password>" "Marcus" "000001" super_admin "01059570807"
```

인자:

```text
<email> <password> [displayName] [employeeId] [role] [phone]
```

- `role` 생략 또는 `super_admin` → super_admin
- `role` = `admin` → admin
- `phone` 예: `01059570807` → Firestore/Auth에 `+821059570807` 저장

## 로그인

```bash
cd car_factory_admin
npm run dev
# http://localhost:3001/login
```
