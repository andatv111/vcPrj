# vcBePrj

Spring Boot 기반 V/C Simulation mock B/E 프로젝트입니다. 실제 DB 없이 `data/*.txt` 파일을 테이블처럼 사용해 STS에서 바로 import하고 화면/Service/Repository 흐름을 맞춰볼 수 있게 만든 골격입니다.

## 실행

1. STS 또는 Eclipse에서 `Existing Maven Projects`로 `vcBePrj` 폴더를 import합니다.
2. JDK 17을 설정합니다.
3. `VcBePrjApplication`을 Spring Boot App으로 실행합니다.

기본 포트는 `8080`입니다.

## Mock DB 파일

- `data/VCW_VC_SPEC_MST.txt`
- `data/M14_VC_REQ_EQUIPMENT.txt`
- `data/M14_VC_REQ_CHAMBER.txt`
- `data/M14_VC_REQ_OBJECT.txt`
- `data/M15_VC_REQ_EQUIPMENT.txt`
- `data/M15_VC_REQ_CHAMBER.txt`
- `data/M15_VC_REQ_OBJECT.txt`
- `data/M16_VC_REQ_EQUIPMENT.txt`
- `data/M16_VC_REQ_CHAMBER.txt`
- `data/M16_VC_REQ_OBJECT.txt`

각 TXT는 JSON Lines 형식입니다. 한 줄이 한 row이며, Repository가 SELECT/INSERT/UPDATE/DELETE 역할을 합니다.

## 책임 구조

- `VcCalculationService`: 전체 산출 흐름 조정, GUID 발급, 저장 순서, transaction 경계
- `VcSpecMasterService`: `VCW_VC_SPEC_MST` 기준 조회
- `VcJudgeService`: OK / NG_L / NG_H / N/A 판정
- `VcRequestEquipmentService`: 산출 요청 header 저장과 상태 변경
- `VcRequestChamberService`: Chamber별 산출 결과 저장/조회
- `VcRequestObjectService`: Pipe/Elbow/Reducer 입력 상세 저장/조회
- `VcTableRoutingService`: FAB_ID별 M14/M15/M16 테이블 whitelist routing

## API 메모

F/E 연동 확인용 Controller는 포함했지만, 이 프로젝트의 중심은 API 목록이 아니라 Service, Repository, TXT DB 구조입니다. 실제 DB 전환 시 Repository를 MyBatis/JPA 구현으로 바꾸고 Service 계약은 유지하는 것을 목표로 합니다.

## Transaction

`VcCalculationService.calculateVcRequest()`에 `@Transactional`을 붙여 실제 B/E의 transaction 경계를 표현했습니다. 현재는 TXT 파일 mock DB라 `MockFileTransactionManager`가 no-op으로 동작합니다. 실제 DB 전환 시 이 bean을 제거하고 JDBC/MyBatis transaction manager를 사용하면 됩니다.
## 2026-06-14 React 연동 endpoint 추가

React F/E의 `src/service/api/vc/sim/vcSimBEApi.js` 계약에 맞춰 화면 단위 controller를 추가했습니다.

| endpoint | controller/service | 업무 |
| --- | --- | --- |
| `GET /api/vc/sim/non-bim/equipments` | `VcSimController.equipments` -> `PortalManualDrawingService.searchEquipmentSuggestions` | EQ ID 자동완성 |
| `GET /api/vc/sim/non-bim/manual-drawings` | `VcSimController.manualDrawings` -> `PortalManualDrawingService.searchManualDrawings` | BIM/5D 미적용 Fab 상단 그리드 조회 |
| `GET /api/vc/sim/non-bim/equipment-spec-options` | `VcSimController.equipmentSpecOptions` -> `PortalManualDrawingService.getEquipmentSpecOptions` | radio 선택 후 장비 기준 Model Standard/Min/Max 조회 |
| `GET /api/vc/sim/non-bim/foreline-drawing/download` | `VcSimController.downloadForeline` -> `VcSimFacadeService.buildForelineDownloadText` | Foreline 도면 다운로드 stream |
| `POST /api/vc/sim/non-bim/calculate` | `VcSimController.calculateNonBim` -> `VcSimFacadeService.calculate` -> `VcCalculationService.calculateVcRequest` | Non-BIM 계산 및 M14/M15/M16 TXT 요청 테이블 저장 |
| `GET /api/vc/sim/calculator/options` | `VcSimController.calculatorOptions` | Calculator FAB/MODEL/Model Standard combo |
| `POST /api/vc/sim/calculator/calculate` | `VcSimController.calculateCalculator` -> `VcSimFacadeService.calculate` | Calculator 계산 |
| `POST /api/vc/sim/result/save` | `VcSimController.saveResult` -> `VcSimFacadeService.saveResult` | 결과 저장 응답 계약 확인 |

추가된 mock table:

- `data/VC_PORTAL_MANUAL_DRAWING.txt`: 설계포탈 상단 그리드 조회가 확정되기 전까지 F/E 검증 데이터를 Java 쪽에서 조회하기 위한 JSON Lines table입니다.

연동 key 정책:

- 조회조건은 `fab(optional)`, `eqId(required)`, `constructionNo(optional)`입니다.
- Foreline 다운로드는 업무상 `eqId + constructionNo`를 필수 key로 받습니다. 이후 `drawingKey`, `fileId`, `revision`, `lineId` 같은 보조 key가 생기면 controller query parameter와 `PortalManualDrawingService.findByBusinessKey()` 주변에서 확장하면 됩니다.
- radio 선택 후 Chamber/Spec option 조회도 현재는 `eqId + constructionNo`를 우선 사용합니다. 향후 key가 늘어날 수 있어 `getEquipmentSpecOptions()`에 주석을 남겨 두었습니다.

로그 확인 포인트:

- Controller 진입: `[API][GET /api/vc/sim/...]`, `[API][POST /api/vc/sim/...]`
- 화면 업무 서비스: `[SERVICE][PORTAL][SELECT]`, `[SERVICE][SIM][CALCULATE]`, `[SERVICE][SIM][SAVE_RESULT]`
- 기존 계산 저장 흐름: `[FLOW][CALCULATE][STEP ...]`
- TXT DB 파일 접근: `[TXT_DB][SELECT]`, `[TXT_DB][INSERT]`, `[TXT_DB][INSERT_ALL]`, `[TXT_DB][UPDATE]`, `[TXT_DB][WRITE]`
