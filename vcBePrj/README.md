# V/C Simulation B/E

Spring Boot 3.3, Java 17 기반 V/C Simulation preview B/E입니다.
현재는 실제 DB 대신 `data/*.txt` JSON Lines 파일을 mock table로 사용하며, F/E는 `http://localhost:5173`, B/E는 `http://localhost:8090` 기준으로 연동합니다.

## 실행

1. STS/Eclipse에서 `vcBePrj`를 `Existing Maven Projects`로 import합니다.
2. JDK 17 이상을 설정합니다.
3. `VcBePrjApplication`을 Spring Boot App으로 실행합니다.

| 항목 | 값 |
| --- | --- |
| Server port | `8090` |
| Controller base path | `/api/vc/sim`, `/api/vc/specmaster`, `/api/commcode` |
| Mock DB path | `data` |

```powershell
mvn test
```

F/E 업무 규칙까지 같이 검증하려면 repo root에서 실행합니다.

```powershell
npm run test:vc
```

`npm run test:vc`는 개발 검증용 script입니다. 운영 jar 또는 Spring runtime 파일은 아닙니다.

## 이번 구조 개선

F/E 요청에 따라 `README_API.md`의 API 계약은 앞으로 조금씩 바뀔 수 있습니다.
DB 조회 방식도 TXT mock에서 실제 query mapper로 바뀔 수 있으므로, 이번 변경에서는 기능은 유지하면서 B/E 경계를 아래처럼 정리했습니다.

| 개선 | 내용 |
| --- | --- |
| API response DTO 분리 | `DesignPortalDrawing` domain record를 Controller에서 직접 반환하지 않고 `NonBimManualDrawingResponse`, `NonBimChamberResponse`, `NonBimSpecOptionResponse`로 변환합니다. |
| Response mapper 추가 | `DesignPortalDrawingResponseMapper`가 domain 모델을 F/E API 응답 모델로 변환합니다. |
| Design Portal 조회 port 추가 | `DesignPortalDrawingRepository` interface를 두고 현재 구현은 `TxtDesignPortalDrawingRepository`가 담당합니다. |
| 기능 유지 | JSON field 이름과 기존 API 응답 구조는 유지했습니다. 기존 F/E helper가 그대로 사용할 수 있습니다. |

이 구조의 의도는 내부 DB row나 조회 source가 바뀌어도 F/E 계약은 DTO/mapper에서 방어하는 것입니다.

## 주요 클래스

| 영역 | 파일 | 역할 |
| --- | --- | --- |
| Controller | `VcSimController` | F/E 화면 API endpoint |
| Response Mapper | `DesignPortalDrawingResponseMapper` | domain model을 F/E response DTO로 변환 |
| Facade | `VcSimFacadeService` | 화면 DTO를 계산 service 요청으로 변환 |
| Design Portal Service | `DesignPortalDrawingService` | 수기 도면, EQ, Chamber, Spec option 조회 업무 |
| Design Portal Port | `DesignPortalDrawingRepository` | Design Portal 조회 source 추상화 |
| TXT Design Portal 구현 | `TxtDesignPortalDrawingRepository` | preview TXT table 기반 Design Portal 조회 구현 |
| Calculation | `VcCalculationService` | GUID 발급, component 저장, conductance 계산, chamber 결과 저장 |
| Spec | `VcSpecMasterService` | `VCW_VC_SPEC_MST` 기준 spec 조회 |
| SpecMaster Admin Controller | `VcSpecMasterController` | Spec Master 관리 화면 API |
| Common Code Controller | `CommonCodeController` | SpecMaster FAB 공통코드 preview API |
| Judge | `VcJudgeService` | `OK`, `NG_L`, `NG_H`, `NA` 판정 |
| Routing | `VcTableRoutingService` | FAB별 `M14/M15/M16` table whitelist routing |
| Mock Repository | `TxtTableRepository` | JSON Lines mock table CRUD |

## Mock Table

| 파일 | 용도 |
| --- | --- |
| `DESIGN_PORTAL_MANUAL_DRAWING.txt` | 설계포탈 수기 도면 query 결과 mock |
| `VCW_VC_SPEC_MST.txt` | Model Standard와 Min/Max Spec 기준 |
| `M14_VC_REQ_EQUIPMENT.txt` | M14 계산 요청 header |
| `M14_VC_REQ_CHAMBER.txt` | M14 chamber 계산 결과 |
| `M14_VC_REQ_COMPONENT.txt` | M14 pipe/elbow/reducer 입력 component |
| `M15_VC_REQ_*` | M15 계산 요청/결과 mock table |
| `M16_VC_REQ_*` | M16 계산 요청/결과 mock table |

`OBJECT` table은 사용하지 않습니다. Pipe, Elbow, Reducer 입력 상세는 `COMPONENT` table에 저장합니다.

## DTO와 column 기준

- 업무/DB column 기준 `WO_ID`는 JSON field `woId`입니다.
- F/E로 나가는 수기 도면 조회 row는 `NonBimManualDrawingResponse`를 기준으로 합니다.
- 내부 Design Portal mock row는 `DesignPortalDrawing` domain record를 기준으로 읽습니다.
- 수기 도면 파일 보조 key는 `file`, `fileSeq`입니다.
- 도면/chamber 조회 업무 key는 `eqId + woId`입니다.
- F/E render용 row id는 B/E DTO field가 아닙니다.
- 계산 request는 `VcSimCalculateRequest`를 기준으로 합니다.
- 결과 저장 request는 `VcSimSaveRequest`를 기준으로 합니다.

## API

상세 request/response JSON, field 정의, query/service 구현 기준은 root [README_API.md](../README_API.md)를 공식 계약으로 봅니다.

| Method | URL | 역할 |
| --- | --- | --- |
| GET | `/api/vc/sim/non-bim/options` | Non-BIM 옵션 |
| GET | `/api/vc/sim/non-bim/equipments` | EQ ID 자동완성 |
| GET | `/api/vc/sim/non-bim/manual-drawings` | 수기 도면 grid 조회 |
| GET | `/api/vc/sim/non-bim/chambers` | 선택 도면 chamber/pipe 조회 |
| GET | `/api/vc/sim/non-bim/equipment-spec-options` | 선택 장비 Model Standard/Spec option |
| GET | `/api/vc/sim/non-bim/foreline-drawing/download` | Foreline 파일 다운로드 |
| POST | `/api/vc/sim/non-bim/calculate` | Non-BIM 계산 |
| GET | `/api/vc/sim/calculator/options` | Calculator 옵션 |
| POST | `/api/vc/sim/calculator/calculate` | Calculator 계산 |
| POST | `/api/vc/sim/result/save` | 결과 저장 |
| GET | `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC` | SpecMaster FAB 공통코드 |
| GET | `/api/vc/specmaster/selectfilteroptions` | SpecMaster 콤보 옵션 |
| POST | `/api/vc/specmaster/search` | SpecMaster 좌측 Master Grid |
| POST | `/api/vc/specmaster` | SpecMaster Master 신규 |
| POST | `/api/vc/specmaster/{specId}/children` | SpecMaster Detail 신규 |
| PATCH | `/api/vc/specmaster/{specId}` | SpecMaster Master/Detail 수정 |
| DELETE | `/api/vc/specmaster/{specId}` | SpecMaster Master/Detail 삭제 |

SpecMaster의 실제 화면/B/E API 계약은 root [md/SPEC_MASTER_API.md](../md/SPEC_MASTER_API.md)를 기준으로 봅니다.

## 계산 규칙

- Non-BIM은 F/E에서 Model Standard와 Min/Max Spec이 있는 chamber만 계산 대상으로 보냅니다.
- Calculator는 spec 없이도 계산 요청할 수 있습니다.
- spec 없는 계산 대상 row는 conductance를 계산하고 `NA` 판정으로 처리합니다.
- 계산 제외 row는 F/E에서 `conductance: "N/A"`, `judge: "NA"`로 표시합니다.
- 하나라도 `NG_L` 또는 `NG_H`이면 equipment header의 `SPEC_YN`은 `Y`가 됩니다.

## 운영 구현 주의사항

- 8090에 이전 B/E가 떠 있으면 F/E 화면은 이전 API 응답을 봅니다. DTO/option 변경 후에는 STS B/E를 재시작합니다.
- `DESIGN_PORTAL_MANUAL_DRAWING.txt`는 preview용 mock입니다. 운영 전환 시 `TxtDesignPortalDrawingRepository` 대신 실제 설계포탈 query mapper 구현체를 연결합니다.
- API response field를 바꿀 때는 `README_API.md`, response DTO, mapper, MockMvc 테스트, F/E helper를 함께 수정합니다.
- Java domain record 이름이 바뀌어도 F/E 계약이 흔들리지 않도록 Controller는 response DTO만 반환합니다.
- FAB table routing은 whitelist 방식으로 유지합니다. 사용자 입력으로 table name을 직접 조합하지 않습니다.
- 회사 시스템에서 작업자 이력이 필요하면 인증/session context의 `empNo`를 service layer에서 받아 저장합니다.

## 로그 확인

STS console에서 아래 prefix로 흐름을 추적합니다.

| Prefix | 의미 |
| --- | --- |
| `[BOOT]` | 실행 설정과 mock DB 경로 |
| `[API]` | Controller 진입 |
| `[SERVICE]` | 화면 업무와 계산 업무 |
| `[FLOW]` | 계산 단계와 저장 순서 |
| `[TABLE_ROUTING]` | FAB별 table 선택 |
| `[TXT_DB]` | mock table CRUD와 row count |


## SpecMaster Search API Update

- SpecMaster grid reads through `POST /api/vc/specmaster/search`.
- This API returns both Master paging rows and the selected Master's Detail rows in one response.
- request body: `{ page, size, fabId, setModelNm, specNm, selectedSpecId, selectedDetailSpecId }`.
- response body: `{ content, rows, details, selectedSpecId, page, size, totalPages, totalElements }`.
- Initial load selects the first Master row returned by the response and fills the Detail grid from the same response.
- After Detail save, the front end searches again with the parent Master `selectedSpecId`, so the Master radio selection and refreshed Detail rows stay visible.
- Old GoodDocs read endpoints are consolidated into `POST /api/vc/specmaster/search`.
- Detail lookup is no longer a separate HTTP endpoint. `POST /api/vc/specmaster/{specId}/children` is used only for Detail creation.
