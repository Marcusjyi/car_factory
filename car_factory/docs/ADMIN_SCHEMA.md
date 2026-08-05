# Admin 컬렉션 (`admins/{uid}`)

`mechanic_admin`과 동일한 모델입니다. 비밀번호는 Firestore에 저장하지 않습니다. Firebase Authentication(이메일/비밀번호)만 사용합니다.

## 스키마

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | string | 로그인 이메일 |
| `displayName` | string | 표시 이름 |
| `employeeId` | string \| optional | 사번 |
| `isApproved` | boolean | `true`여야 로그인 가능 |
| `role` | `"admin"` \| `"super_admin"` | 권한 |
| `createdAt` | timestamp | 생성 |
| `updatedAt` | timestamp | 수정 |

문서 ID = Firebase Auth UID. 클라이언트 직접 쓰기 금지.

## 최초 계정

```bash
# 모노레포 루트에서
npm run create-admin -- marcusjyi@codepado.com "<password>" "Marcus" "000001" super_admin

# 또는 Functions 시드 callable
cd apps/store
node scripts/seed-initial-admin.mjs marcusjyi@codepado.com "<password>"
```

Firebase Console → Authentication → Sign-in method → **Email/Password** 활성화 필요.

## 로컬 어드민

```bash
# 모노레포 루트
npm run dev:admin
# http://localhost:3001/login
```
