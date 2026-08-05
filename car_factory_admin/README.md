# CARFACTORY Admin

스토어(`car_factory`)와 **별도 Next.js 앱**. Firebase 프로젝트는 동일 (`car-factory-40a14`).

## 로컬

```bash
cd car_factory_admin
# .env.example → .env.local
npm install
npm run dev
```

기본 포트 `http://localhost:3001`

## 폴더 역할

| 경로 | 역할 |
|------|------|
| `car_factory_admin/` | 이 어드민 앱 |
| `car_factory/` | 스토어(루트) + Functions + Rules |
| `car_factory_app/` | Flutter 앱 |
| `카팩토리 개발문서/` | 개발 참조 문서 |

## 권한

- Firestore `admins/{uid}` + Email/Password (`isApproved`, role)
- 관리자 추가: **CLI만** (UI 추가 없음)
- 스키마: `카팩토리 개발문서/ADMIN_SCHEMA.md`
- 스크립트: `scripts/create-admin.cjs`

```bash
cd car_factory_admin
npm run create-admin -- email@example.com "<password>" "Name" "000001" super_admin
```
