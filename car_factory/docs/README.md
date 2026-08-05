# 개발문서 안내

AI·개발자가 코드를 수정할 때 **1차 기준**은 워크스페이스 루트의 다음 폴더다.

**`../카팩토리 개발문서/`** (`car_factory/` 형제 폴더)

| 문서 | 용도 |
|------|------|
| `00-AI-코딩-가드레일.md` | 실수 방지 규칙 |
| `01-프로젝트-개요.md` | 폴더 역할 (모노레포 아님) |
| `02-아키텍처.md` | Firebase |
| `03-데이터-모델.md` | 컬렉션·상태·Functions |
| `04-커머스-직거래.md` | 직거래 MVP |
| `05-앱별-구조.md` | store / admin / mobile 경로 |
| `06-변경시-체크리스트.md` | 작업 점검 |

경로: 스토어=`car_factory/`, 어드민=`car_factory_admin/`, 앱=`car_factory_app/`


## 이 폴더(`car_factory/docs/`)의 역할

| 파일 | 역할 |
|------|------|
| [COMMERCE_TODO.md](./COMMERCE_TODO.md) | 직거래 구현 현황·남은 커머스 작업 |
| [ADMIN_SCHEMA.md](./ADMIN_SCHEMA.md) | `admins` 스키마·시드 |
| [CARFACTORY_CURSOR_DEVELOPMENT_SPEC_FIREBASE_ONLY.md](./CARFACTORY_CURSOR_DEVELOPMENT_SPEC_FIREBASE_ONLY.md) | 초기 전체 스펙 (미래 PG 등 포함 → **현재와 다를 수 있음**) |

충돌 시: **`카팩토리 개발문서` + COMMERCE_TODO + 실제 코드** 우선.
