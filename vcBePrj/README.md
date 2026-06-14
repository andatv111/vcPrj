# V/C Simulation B/E

Spring Boot 3.3, Java 17 기반 V/C Simulation B/E 프로젝트입니다. 현재는 실제 DB 대신 `data/*.txt` JSON Lines 파일을 mock table로 사용합니다. Eclipse/STS에서 F/E와 별도로 실행합니다.

## 실행

1. Eclipse/STS에서 `Existing Maven Projects`로 `vcBePrj`를 import합니다.
2. JDK 17을 설정합니다.
3. `VcBePrjApplication`을 Spring Boot App으로 실행합니다.

| 구분 | 값 |
| --- | --- |
| B/E 포트 | `8090` |
| F/E 개발 서버 | `5173` |
| Controller Base Path | `/api/vc/sim` |
| Mock DB 경로 | `data` |

Maven 검증:

```powershell
mvn clean test
```

## 주요 구조

| 계층 | 파일 | 역할 |
| --- | --- | --- |
| Application | `VcBePrjApplication` | Spring Boot 시작점 |
| Controller | `VcSimController` | F/E 화면 API endpoint |
| Facade | `VcSimFacadeService` | F/E DTO와 계산 서비스 연결 |
| Portal Service | `PortalManualDrawingService` | 도면, EQ, Spec 조회와 다운로드 업무 키 확인 |
| Calculation | `VcCalculationService` | 계산, GUID, 저장 순서와 transaction 경계 |
| Judge | `VcJudgeService` | Spec 판정 |
| Routing | `VcTableRoutingService` | FAB별 M14/M15/M16 table routing |
| Repository | `TxtTableRepository` | TXT mock table SELECT/INSERT/UPDATE/DELETE |
| Logging | `logback-spring.xml`, `StartupLogRunner` | 실행 및 업무 흐름 콘솔 로그 |

## Mock Table

| 파일 | 용도 |
| --- | --- |
| `VC_PORTAL_MANUAL_DRAWING.txt` | 설계포탈 쿼리 확정 전 상단 도면 조회 데이터 |
| `VCW_VC_SPEC_MST.txt` | Model Standard와 Min/Max Spec 기준 |
| `M14_VC_REQ_*.txt` | M14 요청/결과 mock table |
| `M15_VC_REQ_*.txt` | M15 요청/결과 mock table |
| `M16_VC_REQ_*.txt` | M16 요청/결과 mock table |

각 파일은 JSON Lines 형식이며 한 줄이 한 row입니다. 실제 DB 전환 시 Service 계약은 유지하고 `TxtTableRepository`를 MyBatis/JPA adapter로 교체합니다.

## Transaction

`VcCalculationService.calculateVcRequest()`가 transaction 경계입니다. 현재는 TXT mock DB이므로 `MockFileTransactionManager`가 사용됩니다. 실제 DB 적용 시 JDBC/MyBatis transaction manager로 교체합니다.

## API

| Method | URL | 업무 |
| --- | --- | --- |
| GET | `/api/vc/sim/non-bim/options` | Non-BIM FAB/Pipe Type 선택지 조회 |
| GET | `/api/vc/sim/non-bim/equipments` | EQ ID 자동완성 |
| GET | `/api/vc/sim/non-bim/manual-drawings` | BIM/5D 미적용 Fab 상단 그리드 조회 |
| GET | `/api/vc/sim/non-bim/chambers` | 선택 도면의 실제 Chamber명/상세 조회 |
| GET | `/api/vc/sim/non-bim/equipment-spec-options` | 장비 기준 Model Standard/Spec 조회 |
| GET | `/api/vc/sim/non-bim/foreline-drawing/download` | Foreline 도면 다운로드 |
| POST | `/api/vc/sim/non-bim/calculate` | Non-BIM 계산 |
| GET | `/api/vc/sim/calculator/options` | Calculator 초기 옵션 조회 |
| POST | `/api/vc/sim/calculator/calculate` | Calculator 계산 |
| POST | `/api/vc/sim/result/save` | 결과 저장 |

상세 query/body/response와 B/E 구현 요청사항은 저장소 루트의 `README_API.md`를 기준으로 합니다.

## 로그 확인

STS 콘솔에서 다음 태그를 기준으로 흐름을 확인할 수 있습니다.

- `[BOOT]`: 시작 설정과 mock DB 경로
- `[API]`: Controller 요청
- `[SERVICE]`: 화면 및 계산 업무
- `[FLOW]`: 계산 단계와 저장 순서
- `[TABLE_ROUTING]`: FAB별 table 선택
- `[TXT_DB]`: TXT 파일 CRUD와 row count

## 연동 원칙

- F/E는 `vcSimApi.js` 하나만 사용합니다.
- B/E 변경 시 Controller/DTO와 루트 `README_API.md`를 함께 갱신합니다.
- 첫 번째 그리드 업무 PK는 `constructionNo`입니다.
- 기존 Chamber 탭명은 `VC_PORTAL_MANUAL_DRAWING.txt`의 `chambers[].chamberName`을 반환합니다. `M16_VC_REQ_CHAMBER.txt`의 순번명은 초기 탭명 원천이 아닙니다.
- 다운로드는 `eqId + constructionNo`가 필수이며 `drawingKey`, `fileId`는 보조 키입니다.
- 설계포탈 실제 쿼리 확정 후 `PortalManualDrawingService`의 TXT 조회를 실제 DB adapter로 교체합니다.
- F/E 조회조건/콤보/그리드에 표시되는 업무 데이터는 B/E API가 제공합니다. 화면 위치와 레이아웃은 변경하지 않습니다.
- FAB/MODEL/Model Standard/Pipe Type 같은 선택지는 `{ value, label }` 형식으로 반환합니다.
