# V/C Simulation Preview

V/C Simulation 업무를 React, Redux, Saga, mock API로 검증하는 미리보기 프로젝트입니다. 현재 화면은 실제 저장 데이터를 다시 조회해서 보여주는 Master 화면이 아니라, Non-BIM 수기 도면과 수동 Calculator 조건으로 Vacuum Conductance를 산출하는 계산 화면입니다.

## 실행

```bash
npm install
npm run dev
npm run build
```

개발 서버는 Vite 기본 포트인 `5173`에서 실행됩니다.

## 화면 구성

| 화면 | 설명 |
| --- | --- |
| BIM/5D Not Applied Fab | EQ ID 또는 공사번호로 수기 도면을 조회하고, 선택한 공사번호 기준으로 Chamber 탭과 배관 정보를 편집해 V/C를 산출합니다. |
| V/C Calculator | 도면 없이 Fab, Model, Model Standard, Chamber, 배관 정보를 직접 입력해 V/C를 산출합니다. |
| Test Data Guide | mock API가 제공하는 샘플 EQ ID, 공사번호, 테스트 시나리오를 안내합니다. |
| Vacuum Conductance Result | Non-BIM과 Calculator가 공유하는 결과 팝업입니다. 계산 결과, Spec Out, N/A 판정 안내를 담당합니다. |
| V/C Draft Attach Popup | Spec Out 결과를 최종 저장할 때 필요한 표준 기안 첨부 입력 팝업입니다. 결과 팝업과 별도 파일로 분리되어 있습니다. |

## 핵심 업무 기준

### 공사번호가 화면 PK

첫 번째 그리드 row의 업무 키는 `constructionNo`입니다. `drawingId` 또는 `drawingKey`는 Foreline 다운로드나 B/E 연동에 필요한 보조 식별자일 수 있지만, 화면 선택 상태와 Chamber 상태 관리는 공사번호 기준으로 동작해야 합니다.

관련 파일:

| 목적 | 파일 |
| --- | --- |
| row 선택 및 Chamber 초기화 | `src/store/vc/nonBim/reducer.js` |
| 선택 row selector | `src/store/vc/nonBim/vcSimSelector.js` |
| Foreline 다운로드 payload | `src/saga/vc/nonBim/vcSimSaga.js` |
| 도면 row 정규화 | `src/components/vc/nonBim/core/NonBim.helper.js` |

### 상단 그리드 Status 의미

상단 그리드의 `Status`는 공사요청상태입니다. 이 화면의 계산 저장, 기안 첨부, 최종 저장 상태를 다시 이 화면에 반영하기 위한 값이 아닙니다. 저장 결과는 향후 개발될 V/C Master 또는 이력 화면에서 조회해야 하며, 이 계산 화면은 다시 접근해도 언제든 재산출할 수 있어야 합니다.

### Chamber 탭 생성

상단 그리드는 `chamberCount`를 숨은 업무 데이터로 보유합니다. 하단 Chamber 탭은 기존 로직과 동일하게 `chamberCount` 또는 B/E가 내려준 `chambers` 배열 기준으로 생성합니다.

- B/E가 Chamber 상세를 내려주면 그 값을 우선 사용합니다.
- Chamber 상세가 없으면 `chamberCount`만큼 `Ch01`, `Ch02` 형태의 기본 Chamber를 만듭니다.
- 기본 도면에서 온 Chamber는 `locked: true`이며 삭제 대상이 아닙니다.
- 사용자가 추가한 Chamber는 `locked: false`이며 삭제할 수 있습니다.

### Model Standard와 Spec 기준

V/C 산출 가능 여부는 상단 그리드의 모델 정보가 아니라 각 Chamber 탭의 `modelStandard`, `minSpec`, `maxSpec`, `calculateEnabled` 기준으로 판단합니다.

- Model Standard는 기존처럼 선택 가능합니다.
- Min Spec과 Max Spec은 직접 수정할 수 없고, 선택한 Model Standard의 B/E 또는 MDM 데이터로만 세팅합니다.
- 선택 가능한 Model Standard가 없거나, 선택한 기준에 Min/Max Spec이 없으면 해당 Chamber의 산출대상 스위치는 자동으로 꺼집니다.
- 산출대상 스위치가 꺼진 Chamber는 결과 팝업에서 Conductance와 판정을 `N/A`로 표시합니다.
- `Spec not applied`처럼 Spec이 없는 기준은 `N/A` 대상이며, 결과 팝업에서 "모든 Spec 판정이 IN" 성공 문구를 보여주면 안 됩니다.

### 결과 팝업 안내 기준

Vacuum Conductance Result 팝업은 공통 팝업으로 관리합니다. 현재는 Non-BIM과 Calculator에서 쓰지만, 향후 V/C Master와 이력 화면에서도 재사용할 수 있어야 합니다.

안내 문구 우선순위는 다음과 같습니다.

1. `HIGH_OUT` 또는 `LOW_OUT` row가 있으면 Spec Out 안내를 표시합니다.
2. Spec Out은 없지만 `N/A` row가 있으면 산출대상 제외 또는 Spec 미적용 안내를 표시합니다.
3. Spec Out과 N/A가 모두 없을 때만 "모든 Spec 판정이 IN입니다. 최종결과저장이 가능합니다."를 표시합니다.

### 표준 기안 첨부 팝업 분리

`VcResultPopup.js`는 Vacuum Conductance 결과만 담당합니다. Spec Out 저장 시 필요한 표준 기안 첨부 UI는 `VcDraftAttachPopup.js`로 분리했습니다.

관련 파일:

| 목적 | 파일 |
| --- | --- |
| 결과 팝업 UI | `src/components/vc/nonBim/popup/VcResultPopup.js` |
| 표준 기안 첨부 팝업 UI | `src/components/vc/nonBim/popup/VcDraftAttachPopup.js` |
| 결과 팝업 공통 Redux | `src/store/vc/vcResult/*` |
| 결과 안내 selector | `src/store/vc/vcResult/vcSimSelector.js` |

## 주요 파일

| 목적 | 파일 |
| --- | --- |
| 앱 shell, 좌측 메뉴, 테스트 데이터 안내 | `src/main.js` |
| Non-BIM 수기 도면 화면 | `src/components/vc/nonBim/Bim5DNotApplied.js` |
| 수동 V/C Calculator 화면 | `src/components/vc/nonBim/VcCalculator.js` |
| Chamber, Pipe, 결과 정규화 helper | `src/components/vc/nonBim/core/NonBim.helper.js` |
| 컬럼, pipe type, 판정 코드 상수 | `src/components/vc/nonBim/core/NonBim.constant.js` |
| Non-BIM Redux | `src/store/vc/nonBim/*` |
| Calculator Redux | `src/store/vc/vcCalculator/*` |
| 공통 결과 팝업 Redux | `src/store/vc/vcResult/*` |
| Saga API orchestration | `src/saga/vc/nonBim/vcSimSaga.js` |
| mock API와 B/E 교체 지점 | `src/service/api/vc/sim/vcSimApi.js` |
| B/E 연동 adapter 초안 | `src/service/api/vc/sim/vcSimBEApi.js` |

## 흐름

### 수기 도면 조회

1. 사용자가 EQ ID 또는 공사번호를 입력합니다.
2. `FETCH_MANUAL_DRAWINGS_REQUEST`를 dispatch합니다.
3. Saga가 `vcSimApi.searchManualDrawings(search)`를 호출합니다.
4. `normalizeDrawingList`가 B/E 응답을 화면 row 모델로 변환합니다.
5. reducer가 `drawings`에 저장합니다.

### 수기 도면 선택

1. 첫 번째 그리드에서 radio를 선택합니다.
2. `SELECT_DRAWING` payload는 `constructionNo`를 사용합니다.
3. reducer가 선택 공사번호에 맞는 row를 찾아 `selectedDrawing`, `selectedConstructionNo`, `chambers`, `activeChamberId`를 세팅합니다.
4. Saga가 선택 row의 장비/모델/공사번호 기준으로 Model Standard 옵션을 추가 조회합니다.

### 계산

1. `CALCULATE_REQUEST`를 dispatch합니다.
2. Saga가 선택 도면과 Chamber별 산출대상, Model Standard, Min/Max Spec, 배관 필수값을 검증합니다.
3. helper가 B/E 계산 API payload를 생성합니다.
4. API가 Chamber별 conductance와 judge를 반환합니다.
5. `normalizeCalculationResult`가 공통 결과 팝업 row 모델로 변환합니다.
6. `vcResultActions.openResultPopup(result)`로 결과 팝업을 엽니다.

### 저장과 기안 첨부

1. 결과 팝업에서 `SAVE_RESULT_REQUEST`를 dispatch합니다.
2. Non-BIM 결과에 Spec Out row가 있으면 reducer와 saga가 표준 기안 첨부 여부를 확인합니다.
3. 기안 제목과 첨부 파일명이 없으면 `VcDraftAttachPopup`을 열고 저장 API 호출은 중단합니다.
4. 기안 정보가 있으면 Saga가 `saveVcResult`를 호출합니다.
5. 저장 성공 후 계산 화면의 상단 그리드 Status를 갱신하지 않습니다. 저장 데이터는 V/C Master 화면의 조회 대상입니다.

## B/E 교체 지점

실제 회사 API를 붙일 때는 화면 컴포넌트보다 `vcSimApi.js`, `vcSimBEApi.js`, `NonBim.helper.js`를 먼저 맞춥니다.

| 교체 대상 | 위치 |
| --- | --- |
| URL, HTTP method, query/body | `vcSimApi.js` 또는 `vcSimBEApi.js` |
| B/E 응답 필드명 차이 | `NonBim.helper.js`의 normalize 함수 |
| 공통코드/MDM option 구조 | `{ value, label, minSpec?, maxSpec?, raw? }` 형태로 변환 |
| 계산 결과 저장 DTO | `saveVcResult` payload |
| 저장 후 Master 조회 상태 | 저장 API 응답의 `savedId`, `nextStatus`, `requestStatus` 등 |
| 파일 첨부 | 현재 preview는 파일명만 저장하므로 실제 연동 시 `attachmentId` 또는 multipart 전송으로 확장 |

## API 초안

상세 계약과 sample payload는 `src/service/api/vc/sim/vcSimBEApi.js`에 유지합니다. B/E 개발자는 이 파일의 endpoint, request body, response wrapper 규칙을 기준으로 실제 Controller와 DTO를 맞추면 됩니다.

중요한 응답 규칙은 다음과 같습니다.

- 목록 API는 배열 자체, `{ data }`, `{ list }`, `{ result }` wrapper를 허용합니다.
- 계산 API는 가능한 한 `{ data: { rows } }` 형태를 권장합니다.
- 결과 row의 `modelStandard`, `minSpec`, `maxSpec`, `calculationTarget`, `conductance`, `judge`는 팝업 표시와 판정 안내에 직접 사용됩니다.
- Spec이 없거나 산출대상이 아닌 row는 `conductance: "N/A"`, `judge: "NA"`로 반환하거나, F/E가 payload 기준으로 보정할 수 있게 row 순서를 유지해야 합니다.
- 저장 API는 계산 화면 상태를 잠그기 위한 목적이 아니라 V/C Master 저장을 위한 목적입니다.

## 검증 체크리스트

1. `npm run build` 성공
2. Non-BIM 화면에서 `VC-2026-PUMP-021` 조회
3. Chamber 탭에서 `Spec not applied` 선택 시 Min/Max Spec이 비어 있고 산출대상 스위치가 꺼지는지 확인
4. 산출 후 결과 팝업에서 해당 row의 Conductance와 판정이 `N/A`인지 확인
5. `N/A` row가 있는 경우 "모든 Spec 판정이 IN" 문구가 나오지 않는지 확인
6. 정상 Spec + IN row만 있을 때 성공 문구가 나오는지 확인
7. Spec Out row가 있으면 표준 기안 첨부 팝업이 별도 파일 컴포넌트로 열리는지 확인
8. Foreline 다운로드가 공사번호 선택 row 기준으로 동작하는지 확인
9. 저장 성공 후 계산 화면 상단 그리드 Status가 저장 상태로 잠기지 않는지 확인
10. V/C Calculator에서도 같은 결과 팝업과 N/A 안내 기준이 적용되는지 확인

## 남은 연동 과제

- 실제 파일 업로드 방식을 결정해 `File` 객체 또는 `attachmentId`를 저장 payload에 포함해야 합니다.
- 운영 B/E 상태 코드가 확정되면 Master 화면 기준 상태와 계산 화면 재산출 정책을 분리해서 문서화해야 합니다.
- 회사 공통 Grid/Combo 컴포넌트 전환 시 현재 table/select wrapper를 교체하면 됩니다.


## B/E 개발 정식 요청서

이 섹션은 B/E 개발자에게 그대로 전달하기 위한 요청 내용입니다. 상세 endpoint와 adapter 초안은 `src/service/api/vc/sim/vcSimBEApi.js`의 `VC_SIM_BE_ENDPOINTS`, `VC_SIM_BE_DEVELOPMENT_REQUEST`를 기준으로 합니다.

### 공통 요청

- 모든 API는 JSON 응답을 기본으로 하고, 가능하면 `{ success, data, message, errorCode }` wrapper를 사용해 주세요.
- 목록 응답은 배열 자체, `{ data }`, `{ list }`, `{ result }`도 F/E에서 흡수할 수 있지만 운영 표준은 하나로 정해 주세요.
- 첫 번째 그리드의 업무 PK는 `constructionNo`입니다. `drawingId`, `drawingKey`, `manualDrawingId`는 다운로드 또는 연동 보조 키로만 사용합니다.
- 계산 화면의 저장 API는 향후 V/C Master 또는 이력 화면 저장을 위한 API입니다. 저장 성공 응답으로 이 계산 화면의 상단 그리드 Status를 잠그지 않습니다.
- 오류 응답은 HTTP status와 사용자가 이해할 수 있는 `message`를 포함해 주세요.

### 화면별 개발 요청

| 화면 | 필요한 API | B/E 개발 요청 |
| --- | --- | --- |
| BIM/5D 미적용 Fab | EQ 자동완성, 수기 도면 조회, Model Standard 조회, Foreline 다운로드, Non-BIM 계산 | 수기 도면 row에는 `constructionNo`, `eqId`, `fab`, `model`, `requestStatus`, `chamberCount`, `foreline.fileId`를 포함해 주세요. Chamber 상세가 있으면 `chambers` 또는 `chamberList`로 내려주세요. |
| V/C Calculator | Calculator 옵션 조회, Calculator 계산 | `fabs`, `models`, `modelStandards`를 반환하고, 계산 결과는 Non-BIM과 동일한 rows 구조로 내려 공통 결과 팝업을 재사용하게 해 주세요. |
| V/C Master 또는 이력 화면 | 결과 저장 데이터 조회 | 현재 계산 화면이 저장한 `saveVcResult` 데이터를 조회할 화면입니다. 계산 화면과 별도 API/화면으로 설계해 주세요. |

### 팝업별 개발 요청

| 팝업 | 필요한 B/E 데이터 | 판정/저장 기준 |
| --- | --- | --- |
| Vacuum Conductance Result | 계산 API의 `rows` | row별 `chamberId`, `processLarge`, `processMiddle`, `modelStandard`, `minSpec`, `maxSpec`, `conductance`, `judge`, `calculationTarget`를 반환해 주세요. `HIGH_OUT`/`LOW_OUT`은 Spec Out, `NA`는 산출대상 제외 또는 Spec 미적용입니다. |
| 표준 기안 첨부 팝업 | 저장 API의 `draft` | Spec Out Non-BIM 결과 저장 시 `draft.title`, `draft.comment`, `draft.attachmentName` 또는 실제 `attachmentId`를 저장할 수 있어야 합니다. |

### API별 요청 요약

| API | Method | 요청 | 응답 핵심 |
| --- | --- | --- | --- |
| `/api/vc/sim/non-bim/equipments` | GET | `keyword` | EQ 자동완성 후보 배열 |
| `/api/vc/sim/non-bim/manual-drawings` | GET | `eqId`, `constructionNo`, paging | 수기 도면 row 배열. `constructionNo` 필수 |
| `/api/vc/sim/non-bim/equipment-spec-options` | GET | `eqId`, `fab`, `model`, `constructionNo` | `value`, `label`, `minSpec`, `maxSpec` option 배열 |
| `/api/vc/sim/non-bim/foreline-drawing/download` | GET | `drawingKey`, `fileId`, `constructionNo` | Blob/Stream 파일 body |
| `/api/vc/sim/non-bim/calculate` | POST | `sourceType`, `equipment`, `chambers`, `pipeList` | 결과 `rows`. N/A 대상은 `conductance: "N/A"`, `judge: "NA"` 권장 |
| `/api/vc/sim/calculator/options` | GET | 없음 또는 기본 조건 | `fabs`, `models`, `modelStandards` |
| `/api/vc/sim/calculator/calculate` | POST | Calculator `equipment`, `chambers`, `pipeList` | Non-BIM과 동일한 결과 `rows` |
| `/api/vc/sim/result/save` | POST | `sourceType`, `basicInfo`, `rows`, `draft` | `savedId`, `savedAt`, `rowCount`, `draftAttached` |

### 반드시 지켜야 할 판정 규칙

- `IN`: Spec 범위 안에 있는 정상 row입니다.
- `HIGH_OUT`, `LOW_OUT`: Spec Out row이며, Non-BIM 저장 시 표준 기안 첨부가 필요합니다.
- `NA`: 산출대상 스위치 off 또는 Spec 미적용 row입니다. 결과 팝업에서 Conductance와 판정을 `N/A`로 표시합니다.
- `NA` row가 하나라도 있으면 "모든 Spec 판정이 IN" 성공 문구를 표시하지 않습니다.
- Model Standard가 없거나 Min/Max Spec이 없으면 F/E는 해당 Chamber를 산출대상 off로 처리합니다.

### 파일 첨부 결정 필요 사항

현재 preview는 파일 객체를 업로드하지 않고 `attachmentName`만 mock 저장합니다. 운영 구현 전 아래 둘 중 하나를 결정해 주세요.

1. 파일 업로드 API를 먼저 호출해 `attachmentId`를 받은 뒤 `saveVcResult`에 `attachmentId`만 전달
2. `saveVcResult`를 `multipart/form-data`로 만들고 JSON blob과 파일을 함께 전달
