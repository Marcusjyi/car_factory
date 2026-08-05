# 카팩토리(CARFACTORY) 개발문서

> **AI·개발자 공통 참고 문서.** 코드 작성·수정 전에 반드시 이 폴더를 읽고, 변경 후에는 관련 문서를 갱신한다.

최종 갱신: 2026-08-04

## 문서 읽는 순서 (작업 시작 시)

| 순서 | 파일 | 용도 |
|------|------|------|
| 1 | [00-AI-코딩-가드레일.md](./00-AI-코딩-가드레일.md) | 실수 방지 필수 규칙 |
| 2 | [01-프로젝트-개요.md](./01-프로젝트-개요.md) | 무엇이 정식 소스인지, 앱 역할 |
| 3 | [02-아키텍처.md](./02-아키텍처.md) | 모노레포·Firebase·배포 |
| 4 | [03-데이터-모델.md](./03-데이터-모델.md) | 컬렉션·상태값·쓰기 권한 |
| 5 | [04-커머스-직거래.md](./04-커머스-직거래.md) | 현재 MVP 거래 플로우 |
| 6 | [05-앱별-구조.md](./05-앱별-구조.md) | store / admin / mobile 경로 |
| 7 | [06-변경시-체크리스트.md](./06-변경시-체크리스트.md) | PR·작업 전후 점검 |

## 모노레포 내 보조 문서

정식 코드 루트: `car_factory/` (이 워크스페이스의 `car_factory` 폴더)

| 경로 | 내용 |
|------|------|
| `car_factory/README.md` | 빠른 시작 |
| `car_factory/docs/COMMERCE_TODO.md` | 직거래 MVP·남은 커머스 작업 |
| `car_factory/docs/ADMIN_SCHEMA.md` | `admins/{uid}` 스키마 |
| `car_factory/docs/CARFACTORY_CURSOR_DEVELOPMENT_SPEC_FIREBASE_ONLY.md` | 초기 전체 스펙(미래 PG·리뷰 포함 → **현재 구현과 다를 수 있음**) |
| `car_factory/apps/mobile/docs/MOBILE_DEV.md` | Flutter ↔ 웹 계약 |

> 스펙 문서와 본 폴더·`COMMERCE_TODO.md`가 충돌하면 **본 폴더 + COMMERCE_TODO + 실제 코드**를 우선한다.

## 문서 유지 원칙

1. 기능·스키마·Functions·Rules를 바꾸면 **같은 작업에서** 이 폴더도 갱신한다.
2. “앞으로 할 일”과 “이미 구현됨”을 섞지 않는다.
3. 레거시 폴더(`car_factory_app`, `car_factory_admin`)는 소스가 아니다.
