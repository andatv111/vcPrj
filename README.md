#git
1. 집 PC에서 Codex + Git 연결
git init
git remote add origin https://github.com/andatv111/vcPrj.git
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
-이미 Git 연결된 폴더면 이것만 확인:
git remote -v
git status
git pull
2. 핸드폰 웹 Codex에서 작업한 뒤


# V/C Simulation Front-End Conversion Guide

이 프로젝트는 BIM/5D 미적용 Fab 화면, V/C Calculator, 결과 저장 팝업을 React/Redux/Saga로 구현한 프론트엔드 샘플입니다. 현재 코드는 UI 기능 검증을 위해 mock API와 HTML 기본 테이블/폼을 사용하고 있으며, 회사 프로젝트에 이관할 때는 회사의 공통 컴포넌트, 공통코드 조회 규칙, HTTP 인스턴스, Java/XML Query 기반 B/E API에 맞춰 연결해야 합니다.

## 먼저 볼 파일

| 목적 | 파일 |
| --- | --- |
| 화면 UI와 이벤트 연결 | `src/components/vc/nonBim/Bim5DNotApplied.js` |
| V/C Calculator 화면 | `src/components/vc/nonBim/VcCalculator.js` |
| 결과 팝업/저장/기안 첨부 | `src/components/vc/nonBim/popup/VcResultPopup.js` |
| 화면 상태 변경 | `src/store/vc/nonBim/reducer.js`, `src/store/vc/vcCalculator/reducer.js`, `src/store/vc/vcResult/reducer.js` |
| 화면에서 Redux state를 읽는 경로 | `src/store/vc/**/vcSimSelector.js` |
| API 호출 흐름 | `src/saga/vc/nonBim/vcSimSaga.js` |
| 임시 API 계약과 mock 구현 | `src/service/api/vc/sim/vcSimApi.js` |
| B/E 응답을 화면 모델로 변환 | `src/components/vc/nonBim/core/NonBim.helper.js` |
| 컬럼, 배관 유형, 판정 코드 등 기준값 | `src/components/vc/nonBim/core/NonBim.constant.js` |

## 회사 코드로 전환할 때의 원칙

현재 구현은 회사 표준을 모르는 상태에서 기능 흐름을 먼저 맞춘 것입니다. 따라서 회사 프로젝트에 붙일 때는 다음 순서로 전환하면 됩니다.

1. 화면 컴포넌트의 HTML `select`, `input`, `table`, `button`을 회사 공통 컴포넌트로 교체합니다.
2. `vcSimSelector.js`는 꼭 그대로 써야 하는 파일이 아니라 Redux state 접근을 한곳에 모으기 위한 임시 어댑터입니다. 회사에서 `useAppSelector`, `connect`, 화면별 selector 네이밍 규칙을 쓴다면 그 규칙으로 교체하되, 컴포넌트가 root state 경로를 직접 알지 않게 유지합니다.
3. 콤보박스, 조회성 코드, 모델 기준 목록은 회사의 공통코드 API 또는 MDM API 규칙으로 교체합니다. 프론트 화면에는 `{ value, label }` 형태만 맞춰서 넘기면 됩니다.
4. `vcSimApi.js`의 mock 함수들은 실제 B/E API 호출로 교체합니다. B/E 응답 필드명이 달라져도 `NonBim.helper.js`의 normalize 함수에서 흡수하면 화면 변경을 최소화할 수 있습니다.
5. 그리드 데이터는 API 응답을 바로 뿌리지 말고 `normalizeDrawingList`, `normalizeCalculationResult`처럼 화면 표준 row 모델로 한 번 변환한 뒤 reducer에 저장합니다.

## 공통코드/콤보박스 전환 가이드

현재 `vcSimApi.js`의 `getCalculatorOptions`, `getEquipmentSpecOptions`는 Fab, Model, Model Standard 같은 조회성 데이터를 mock으로 반환합니다. 회사 코드에서는 다음 중 하나로 전환하면 됩니다.

| 현재 위치 | 현재 형태 | 회사 전환 방향 |
| --- | --- | --- |
| `getCalculatorOptions()` | `{ fabs, models, modelStandards }` | 회사 공통코드 조회 API 또는 MDM API 호출 |
| `getEquipmentSpecOptions({ eqId, fab, model, drawingId })` | 선택 도면/설비 기준 Model Standard 목록 | 설비/모델 기준 V/C Spec 조회 API 호출 |
| 화면의 HTML `select` | `{ value, label }` 배열 | 회사 공통 Select/Combo 컴포넌트의 option 규격으로 변환 |

공통코드 API가 예를 들어 `code`, `codeName`을 반환한다면 프론트에서는 다음처럼 맞춥니다.

```js
const options = response.list.map((item) => ({
  value: item.code,
  label: item.codeName,
  raw: item,
}));
```

중요한 점은 화면 컴포넌트가 회사 공통코드 응답 필드명을 직접 알지 않게 하는 것입니다. 변환은 API 레이어 또는 helper에서 끝내는 편이 안전합니다.

## B/E 개발 요청 API

`src/service/api/vc/sim/vcSimApi.js`에 있는 함수 대부분은 B/E 개발자에게 “이런 API가 필요합니다”라고 전달할 계약 초안입니다. URL은 예시이며, 회사 표준 URI/Controller 명명 규칙에 맞춰 바꾸면 됩니다.

### 1. EQ ID 자동완성

- Front 함수: `searchEqSuggestions(keyword)`
- 예시 URL: `GET /api/vc/sim/non-bim/equipments`
- Query: `keyword`
- 목적: 사용자가 EQ ID를 입력할 때 자동완성 후보를 조회합니다.

요청 예시:

```http
GET /api/vc/sim/non-bim/equipments?keyword=EQ-VAC
```

응답 예시:

```json
{
  "list": [
    {
      "eqId": "EQ-VAC-ETCH-1001",
      "constructionNo": "VC-2026-ETCH-001",
      "fab": "P3",
      "area1": "ETCH",
      "label": "EQ-VAC-ETCH-1001 (P3 / ETCH)"
    }
  ]
}
```

Java/XML Query 개발 포인트:

- `keyword`는 EQ ID 부분검색 조건으로 사용합니다.
- 화면 자동완성이므로 최대 건수 제한이 필요합니다. 예: `ROWNUM <= 20`, `FETCH FIRST 20 ROWS ONLY`.
- 회사 표준 공통검색이 있다면 label은 B/E에서 만들지 않고 F/E에서 조합해도 됩니다.

### 2. 수기 도면 조회

- Front 함수: `searchManualDrawings(params)`
- 예시 URL: `GET /api/vc/sim/non-bim/manual-drawings`
- Query: `eqId`, `constructionNo`
- 목적: 첫 번째 그리드에 표시할 수기 도면 목록을 조회합니다.

응답 필드:

| 필드 | 설명 |
| --- | --- |
| `id` 또는 `drawingId` | 도면 식별자 |
| `constructionNo` | 공사번호 |
| `eqId` | 설비 ID |
| `site`, `fab`, `area1`, `area2` | 위치/라인 정보 |
| `changeType` | 변경 유형 |
| `equipmentType` | 설비 유형 |
| `requestStatus` | 요청 상태 |
| `model`, `mainMaker` | 모델/제조사 |
| `processLarge`, `processMiddle` | 공정 대/중분류 |
| `chamberCount` | 기본 Chamber 수 |
| `foreline.fileId`, `foreline.fileName` | Foreline 도면 파일 정보 |
| `chambers[]` | 도면 선택 시 자동 생성할 Chamber 상세 |
| `specOptions[]` | Model Standard 후보 |

Java/XML Query 개발 포인트:

- 목록 조회는 도면 기본정보와 Foreline 파일 메타를 함께 반환해야 합니다.
- Chamber/배관 상세가 한 번에 조회 가능하면 `chambers[]`로 내려주고, 성능상 분리해야 하면 “도면 선택 후 Chamber 상세 조회 API”를 별도로 두어도 됩니다.
- F/E는 현재 `normalizeDrawingList`에서 여러 필드명을 허용하지만, 실제 개발 시에는 B/E 표준명을 하나로 정하는 것이 좋습니다.

### 3. Foreline 도면 다운로드

- Front 함수: `downloadForelineDrawing({ drawingId, fileId })`
- 예시 URL: `GET /api/vc/sim/non-bim/foreline-drawing/download`
- Query: `drawingId`, `fileId`
- 목적: 선택한 도면의 Foreline 파일을 다운로드합니다.

B/E 응답:

- 파일 Stream 또는 byte array
- `Content-Type`: 실제 파일 MIME
- `Content-Disposition`: attachment 파일명 포함

Java/XML Query 개발 포인트:

- `fileId` 기준으로 파일 저장소의 물리 경로 또는 BLOB을 조회합니다.
- 권한 체크가 필요하면 `drawingId`와 사용자 권한을 함께 검증합니다.

### 4. 설비별 Model Standard/Spec 조회

- Front 함수: `getEquipmentSpecOptions({ eqId, fab, model, drawingId })`
- 예시 URL: `GET /api/vc/sim/non-bim/equipment-spec-options`
- 목적: 선택 도면 또는 설비/모델에 맞는 Model Standard, Min Spec, Max Spec 목록을 조회합니다.

응답 예시:

```json
{
  "list": [
    {
      "value": "ETCH-LINE-A",
      "label": "ETCH-LINE-A / General",
      "minSpec": "35",
      "maxSpec": "72"
    }
  ]
}
```

Java/XML Query 개발 포인트:

- 주요 조회 조건은 `drawingId`, `eqId`, `fab`, `model`입니다.
- 회사 MDM 테이블에서 모델 기준/Spec 기준을 조회하는 쿼리가 필요합니다.
- Min/Max는 숫자 계산에 쓰이므로 문자열로 내려주더라도 숫자 변환 가능한 값이어야 합니다.

### 5. Non-BIM V/C 계산

- Front 함수: `calculateNonBim(payload)`
- 예시 URL: `POST /api/vc/sim/non-bim/calculate`
- 목적: 선택 도면과 Chamber/배관 입력값으로 Conductance를 계산하고 Spec 판정을 반환합니다.

요청 payload 핵심 구조:

```json
{
  "sourceType": "NON_BIM",
  "manualDrawingId": "DWG-ETCH-001",
  "equipment": {
    "eqId": "EQ-VAC-ETCH-1001",
    "constructionNo": "VC-2026-ETCH-001",
    "fab": "P3",
    "model": "VX-ETCH-300",
    "modelStandard": "ETCH-LINE-A"
  },
  "chambers": [
    {
      "seq": 1,
      "chamberId": "CH-ETCH-A",
      "chamberName": "Ch01",
      "modelStandard": "ETCH-LINE-A",
      "minSpec": "35",
      "maxSpec": "72",
      "isSpecSkipped": false,
      "pipeList": [
        {
          "seq": 1,
          "type": "PIPE",
          "inletDiameter": "4",
          "length": "1200",
          "angle": "",
          "outletDiameter": "",
          "quantity": "1"
        }
      ]
    }
  ]
}
```

응답 payload 핵심 구조:

```json
{
  "data": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fab": "P3",
    "model": "ETCH-LINE-A",
    "rows": [
      {
        "resultId": "RESULT-1",
        "chamberId": "CH-ETCH-A",
        "chamberName": "Ch01",
        "confirmYn": "N",
        "processLarge": "ETCH",
        "processMiddle": "Metal Etch",
        "modelStandard": "ETCH-LINE-A",
        "minSpec": "35",
        "maxSpec": "72",
        "conductance": "55.21",
        "judge": "IN"
      }
    ]
  }
}
```

Java/XML Query 개발 포인트:

- 계산식이 DB 함수, Java 서비스, 외부 엔진 중 어디에 있는지 먼저 확정해야 합니다.
- 배관 유형은 현재 `PIPE`, `ELBOW`, `REDUCER` 세 가지입니다.
- `PIPE`: `inletDiameter`, `length` 필수, 수량은 1 고정
- `ELBOW`: `inletDiameter`, `angle`, `quantity` 필수
- `REDUCER`: `inletDiameter`, `length`, `outletDiameter` 필수, 수량은 1 고정
- 판정 코드는 F/E 표준으로 `IN`, `HIGH_OUT`, `LOW_OUT`, `NONE`, `PENDING`을 사용합니다. B/E가 `SPEC_IN`처럼 다른 코드를 쓰면 `normalizeJudge`에서 변환 가능합니다.

### 6. Calculator 초기 옵션 조회

- Front 함수: `getCalculatorOptions()`
- 예시 URL: `GET /api/vc/sim/calculator/options`
- 목적: 독립 계산기 화면의 Fab, Model, Model Standard 콤보 옵션을 조회합니다.

응답 예시:

```json
{
  "fabs": [{ "value": "P3", "label": "P3" }],
  "models": [{ "value": "VX-ETCH-300", "label": "VX-ETCH-300" }],
  "modelStandards": [
    { "value": "ETCH-LINE-A", "label": "ETCH-LINE-A / General", "minSpec": "35", "maxSpec": "72" }
  ]
}
```

Java/XML Query 개발 포인트:

- 회사 공통코드 또는 MDM 조회 결과를 화면 option 구조로 변환해 내려주거나, F/E API 레이어에서 변환합니다.
- Fab와 Model 선택에 따라 Model Standard를 동적으로 다시 조회해야 한다면 `getEquipmentSpecOptions`를 재사용해도 됩니다.

### 7. Calculator 계산

- Front 함수: `calculateVcCalculator(payload)`
- 예시 URL: `POST /api/vc/sim/calculator/calculate`
- 목적: 도면 없이 사용자가 입력한 Chamber/배관 정보만으로 계산합니다.

개발 포인트:

- 요청/응답 구조는 `calculateNonBim`과 거의 같습니다.
- 차이는 `sourceType`이 `CALCULATOR`이고 `manualDrawingId`가 없다는 점입니다.
- Model Standard가 없으면 Spec 판정은 `NONE`으로 처리할 수 있습니다.

### 8. 결과 저장

- Front 함수: `saveVcResult(payload)`
- 예시 URL: `POST /api/vc/sim/result/save`
- 목적: 계산 결과 row와 기본정보, 필요 시 Spec Out 기안 첨부 정보를 저장합니다.

요청 구조:

```json
{
  "sourceType": "NON_BIM",
  "basicInfo": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fab": "P3",
    "model": "ETCH-LINE-A"
  },
  "rows": [
    {
      "chamberId": "CH-ETCH-A",
      "conductance": "55.21",
      "judge": "IN"
    }
  ],
  "draft": {
    "title": "Spec Out 검토 기안",
    "attachmentName": "draft.pdf",
    "comment": "검토 요청"
  }
}
```

Java/XML Query 개발 포인트:

- 저장 마스터 테이블과 결과 상세 테이블을 분리하는 것을 권장합니다.
- `sourceType = NON_BIM`이고 Spec Out row가 있으면 기안 첨부 정보가 필요합니다.
- 저장 성공 시 `savedId`, `savedAt`, `rowCount` 정도를 반환하면 화면 메시지에 사용할 수 있습니다.

## 그리드 데이터 연결 방식

첫 번째 그리드(도면 목록)는 `searchManualDrawings` 응답을 `normalizeDrawingList`로 변환한 뒤 `drawings` state에 저장합니다. 결과 그리드는 계산 API 응답을 `normalizeCalculationResult`로 변환한 뒤 공용 결과 팝업 state에 저장합니다.

회사 그리드 컴포넌트로 바꿀 때는 다음만 지키면 됩니다.

- API 응답을 그리드에 바로 넣지 않습니다.
- 그리드 row의 key는 `id`, `drawingId`, `resultId` 중 하나를 안정적으로 사용합니다.
- 회사 그리드 컬럼 정의가 별도 규격이면 `NonBim.constant.js`의 컬럼 배열만 변환합니다.
- 페이징/정렬/필터가 B/E 방식이면 `searchManualDrawings` params에 page, size, sort를 추가하고 reducer에는 조회 결과와 paging meta를 함께 저장합니다.

## selector 전환 방식

현재 selector 파일은 다음 이유로 존재합니다.

- root reducer 등록 경로가 바뀌어도 화면 컴포넌트를 크게 고치지 않기 위해서입니다.
- `state.vc.nonBim` 같은 실제 Redux 경로를 화면에서 직접 쓰지 않기 위해서입니다.

회사 프로젝트에서 selector 규칙이 다르다면 `vcSimSelector.js`를 그대로 유지할 필요는 없습니다. 다만 아래 원칙은 유지하는 것이 좋습니다.

```js
// 권장: 화면은 selector만 호출
const drawings = useSelector(selectDrawings);

// 비권장: 화면이 root state 경로를 직접 알고 있음
const drawings = useSelector((state) => state.vc.nonBim.drawings);
```

root reducer 등록 예시:

```js
const rootReducer = combineReducers({
  vc: combineReducers({
    nonBim: nonBimReducer,
    vcCalculator: vcCalculatorReducer,
    vcResult: vcResultReducer,
  }),
});
```

## 실제 연동 시 수정 체크리스트

1. `vcSimApi.js`에서 mock `sleep`, `sampleDrawings`, mock 계산식을 제거하고 회사 HTTP client로 교체합니다.
2. `VC_SIM_ENDPOINTS` 값을 회사 Controller URL로 변경합니다.
3. B/E 응답 필드명이 확정되면 `NonBim.helper.js`의 normalize 함수에서 필드 alias를 정리합니다.
4. 회사 공통 Select/Combo 규격에 맞춰 option 변환 함수를 추가합니다.
5. 회사 Grid 컴포넌트로 바꾼 뒤 row key, 선택 이벤트, 다운로드 버튼 이벤트를 연결합니다.
6. 저장 API가 확정되면 Spec Out 기안 첨부 필드명을 B/E DTO와 맞춥니다.
7. Java/XML Query 개발자에게 위 API별 요청/응답 예시와 필수 조건을 전달합니다.

## 메모

- 현재 코드는 mock 기반이므로 `vcSimApi.js`의 계산 결과는 실제 물리 계산식이 아닙니다.
- 회사 표준 HTTP 인스턴스가 있다면 `vcSimApi.js` 하나만 바꾸는 구조가 가장 유지보수에 좋습니다.
- B/E 필드명이 바뀌어도 화면 컴포넌트까지 전파하지 말고 helper/API 레이어에서 흡수하세요.
