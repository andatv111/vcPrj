# V/C Simulation B/E

Spring Boot 3.3, Java 17 기반의 V/C Simulation mock B/E입니다. 실제 DB 대신 `data/*.txt` JSON Lines 파일을 mock table로 사용합니다. F/E는 `http://localhost:5173`, B/E는 `http://localhost:8090` 기준으로 연동합니다.

## 실행

1. STS/Eclipse에서 `vcBePrj`를 `Existing Maven Projects`로 import합니다.
2. JDK 17 이상을 설정합니다.
3. `VcBePrjApplication`을 Spring Boot App으로 실행합니다.

| 항목 | 값 |
| --- | --- |
| Server port | `8090` |
| Controller base path | `/api/vc/sim` |
| Mock DB path | `data` |

```powershell
mvn test
```

F/E 업무 규칙까지 함께 확인하려면 루트에서 다음을 실행합니다.

```powershell
npm run test:vc
```

`npm run test:vc`는 `scripts/verify-vc-calculation.mjs`를 실행하는 개발 검증용 명령입니다. B/E 운영 jar나 Spring runtime에 포함되는 파일이 아닙니다.

테스트는 실제 `data` 파일을 직접 수정하지 않고 임시 디렉터리로 복사한 mock DB에서 실행됩니다.

## 주요 클래스

| 영역 | 파일 | 역할 |
| --- | --- | --- |
| Controller | `VcSimController` | F/E 화면 API endpoint |
| Facade | `VcSimFacadeService` | 화면 DTO를 계산 서비스 요청으로 변환 |
| Design Portal | `DesignPortalDrawingService` | 설계포탈 수기도면, EQ, Chamber, Spec 옵션 조회 |
| Calculation | `VcCalculationService` | GUID 발급, COMPONENT 저장, conductance 계산, CHAMBER 결과 저장 |
| Spec | `VcSpecMasterService` | `VCW_VC_SPEC_MST` 기준 spec 조회 |
| Judge | `VcJudgeService` | `OK`, `NG_L`, `NG_H`, `NA` 판정 |
| Routing | `VcTableRoutingService` | FAB별 `M14/M15/M16` table whitelist routing |
| Repository | `TxtTableRepository` | JSON Lines mock table CRUD |

## Mock Table

| 파일 | 용도 |
| --- | --- |
| `DESIGN_PORTAL_MANUAL_DRAWING.txt` | 설계포탈 수기도면 query 결과 mock |
| `VCW_VC_SPEC_MST.txt` | Model Standard와 Min/Max Spec 기준 |
| `M14_VC_REQ_EQUIPMENT.txt` | M14 계산 요청 header |
| `M14_VC_REQ_CHAMBER.txt` | M14 Chamber 계산 결과 |
| `M14_VC_REQ_COMPONENT.txt` | M14 Pipe/Elbow/Reducer 입력 component |
| `M15_VC_REQ_*` | M15 계산 요청/결과 mock table |
| `M16_VC_REQ_*` | M16 계산 요청/결과 mock table |

`OBJECT` table은 사용하지 않습니다. Pipe, Elbow, Reducer 입력 상세는 `COMPONENT` table에 저장합니다.

## 중요한 DTO/컬럼 기준

- 업무 키는 DB 컬럼 `WO_ID`, Java/F/E JSON 필드 `woId`입니다.
- 설계포탈 조회 row는 `DesignPortalDrawing` record를 기준으로 합니다.
- 설계포탈 파일 보조키는 `file`, `fileSeq`입니다.
- 조회 관계 key는 `eqId + woId`입니다.
- F/E 렌더링용 row id는 B/E DTO 필드가 아닙니다.

## API

상세 request/response는 루트 [README_API.md](../README_API.md)를 기준으로 합니다.

| Method | URL | 역할 |
| --- | --- | --- |
| GET | `/api/vc/sim/non-bim/options` | Non-BIM FAB/Pipe Type 옵션 |
| GET | `/api/vc/sim/non-bim/equipments` | EQ ID 자동완성 |
| GET | `/api/vc/sim/non-bim/manual-drawings` | 수기도면 grid 조회 |
| GET | `/api/vc/sim/non-bim/chambers` | 선택 도면의 Chamber/Pipe 조회 |
| GET | `/api/vc/sim/non-bim/equipment-spec-options` | 선택 장비의 Model Standard/Spec 옵션 |
| GET | `/api/vc/sim/non-bim/foreline-drawing/download` | Foreline 파일 다운로드 |
| POST | `/api/vc/sim/non-bim/calculate` | Non-BIM 계산 |
| GET | `/api/vc/sim/calculator/options` | Calculator FAB/MODEL/Spec/Pipe 옵션 |
| POST | `/api/vc/sim/calculator/calculate` | Calculator 계산 |
| POST | `/api/vc/sim/result/save` | 결과 저장 mock |

## 계산 규칙

- Non-BIM은 F/E에서 Model Standard와 Min/Max Spec이 있는 Chamber만 산출대상으로 보냅니다.
- Calculator는 spec 없이도 계산 요청이 올 수 있습니다.
- spec이 없는 산출대상 row는 conductance를 계산하고 `NA` 판정으로 처리합니다. 산출 제외 row는 conductance도 `N/A`로 표시합니다.
- Spec master 완전 일치 row가 없더라도 요청 snapshot의 `minSpec/maxSpec`가 있으면 해당 값을 판정 기준으로 사용합니다.
- 하나라도 `NG_L` 또는 `NG_H`이면 equipment header의 `SPEC_YN`은 `Y`가 됩니다.

## 로그 확인

STS 콘솔에서 다음 prefix를 기준으로 흐름을 추적합니다.

- `[BOOT]`: 실행 설정과 mock DB 경로
- `[API]`: Controller 진입
- `[SERVICE]`: 화면 업무와 계산 업무
- `[FLOW]`: 계산 단계와 저장 순서
- `[TABLE_ROUTING]`: FAB별 table 선택
- `[TXT_DB]`: mock table CRUD와 row count

## 개발 주의사항

- 8090에 이전 B/E가 떠 있으면 F/E 화면은 이전 API 응답을 봅니다. DTO/옵션 변경 후에는 STS의 B/E를 반드시 재시작합니다.
- `DESIGN_PORTAL_MANUAL_DRAWING.txt`는 외부 설계포탈 query 결과를 흉내내는 별도 mock table입니다. 운영 전환 시 실제 query mapper로 교체합니다.
- Java DTO 이름을 바꾸면 F/E helper, API adapter, `README_API.md`, 테스트를 함께 수정합니다.
- FAB table routing은 whitelist 방식으로 유지합니다. 사용자 입력으로 table name을 직접 조합하지 않습니다.
