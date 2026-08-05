# CARFACTORY (스토어)

중고 자동차 부품 C2C 마켓플레이스 — Next.js 스토어 + Firebase Functions/Rules.

| 프로젝트 | 경로 |
|----------|------|
| 스토어 + Functions | `car_factory/` (이 폴더) |
| 어드민 | `../car_factory_admin` |
| Flutter 앱 | `../car_factory_app` |
| 개발문서 | `../카팩토리 개발문서` |

## 시작하기

```bash
npm run install:all
npm run dev          # http://localhost:3000
```

환경변수: `.env.local` ← `.env.example`

## Firebase

```bash
firebase deploy --only firestore:rules,functions
```

App Hosting: 이 폴더 루트 (`apphosting.yaml`).

## 관리자 시드 (CLI만)

스키마: [`../카팩토리 개발문서/ADMIN_SCHEMA.md`](../카팩토리%20개발문서/ADMIN_SCHEMA.md)  
스크립트: [`../car_factory_admin/scripts/create-admin.cjs`](../car_factory_admin/scripts/create-admin.cjs)

```bash
cd ../car_factory_admin
npm run create-admin -- email@example.com "password" "Name" "000001" super_admin
```
