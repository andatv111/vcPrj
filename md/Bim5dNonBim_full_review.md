# BIM/5D Not Applied Fab 전체 코드리뷰 문서

> 기준 브랜치: `codex-work`  
> 대상 화면: `Simulation > V/C Simulation > BIM/5D Not Applied Fab`  
> 관련 팝업: `Vacuum Conductance Result`, `표준 기안 첨부`  
> 관련 범위: F/E React + Redux + Saga + API Adapter + Helper + UI + Popup + B/E Spring Controller/Service/DTO/TXT Repository  
> 목적: 초급 개발자가 이 문서를 보고 다른 사람에게 화면과 코드를 설명할 수 있는 수준으로 이해하도록 정리합니다.

---

## 0. 이 화면을 한 문장으로 설명하면

**BIM/5D가 적용되지 않은 Fab의 수기 도면 데이터를 조회하고, 선택한 장비/WO의 Chamber와 Pipe 정보를 기반으로 V/C Conductance를 계산한 뒤 결과를 저장하거나 Spec Out이면 표준 기안 첨부로 넘기는 화면**입니다.

```txt
FAB/EQ ID 입력
→ Search
→ Manual Drawing Results 조회
→ Row radio 선택
→ Chamber 조회 + Model Standard/Min/Max 조회
→ Chamber/Pipe 편집
→ Calculate
→ Vacuum Conductance Result 팝업
→ Spec IN이면 바로 저장
→ Spec Out이면 표준 기안 첨부 후 저장
```

---

## 1. 가장 중요한 키 정리

현재 최신 코드 기준으로 이 화면의 핵심 업무 키는 `woId`입니다.

| 개념 | 현재 코드 필드 | 설명 |
|---|---|---|
| 공사번호/작업번호 | `woId` | Manual Drawing Results row 선택과 상세 조회의 업무 키 |
| 장비 ID | `eqId` | 장비 식별값 |
| FAB | `fabCd` | 예: `M16` |
| 모델명 | `setModelNm` | 예: `VX-ETCH-300` |
| 화면 row key | `id` | F/E React rendering용 `eqId + woId`, DB PK 아님 |
| DRAWING_ID | 현재 핵심 아님 | 현재 구현은 `eqId + woId` 기준 |

설명 문장:

```txt
이 화면은 DB의 DRAWING_ID를 기준으로 움직이는 게 아니라,
사용자가 선택한 Manual Drawing Results row의 eqId와 woId를 기준으로 움직입니다.
```

---

## 2. 전체 소스 파일 지도

### 2.1 F/E 핵심 파일

| 파일 | 역할 |
|---|---|
| `src/components/vc/nonBim/Bim5DNotApplied.js` | 화면 본체. 검색조건, 도면 그리드, Chamber Workspace, 결과 팝업 조립 |
| `src/components/vc/nonBim/core/NonBim.constant.js` | Pipe Type, Status, Judge, Column, Loading 상수 |
| `src/components/vc/nonBim/core/NonBim.helper.js` | 응답 정규화, Chamber/Pipe 생성, validation, calculate payload 생성, 결과 normalize |
| `src/components/vc/nonBim/ui/DrawingResultTable.js` | Manual Drawing Results 그리드 |
| `src/components/vc/nonBim/ui/ChamberWorkspace.js` | Chamber 탭, Model Standard, Min/Max, Pipe Rows, Add/Remove/Calculate |
| `src/components/vc/nonBim/popup/VcResultPopup.js` | Vacuum Conductance Result 팝업 |
| `src/components/vc/nonBim/popup/VcDraftAttachPopup.js` | Spec Out 시 표준 기안 첨부 팝업 |
| `src/store/vc/nonBim/action.js` | Non-BIM 화면 action 정의 |
| `src/store/vc/nonBim/reducer.js` | Non-BIM 화면 state 변경 |
| `src/store/vc/nonBim/vcSimSelector.js` | Non-BIM 화면 state 읽기 함수 |
| `src/store/vc/vcResult/action.js` | 결과 팝업/저장/기안 action |
| `src/store/vc/vcResult/reducer.js` | 결과 팝업 state, 저장 state, 기안 팝업 state |
| `src/store/vc/vcResult/vcSimSelector.js` | 결과 팝업 selector |
| `src/saga/vc/nonBim/vcSimSaga.js` | action을 받아 B/E API 호출 |
| `src/service/api/vc/sim/vcSimApi.js` | 실제 HTTP GET/POST/Blob 호출 |

### 2.2 B/E 핵심 파일

| 파일 | 역할 |
|---|---|
| `VcSimController.java` | F/E API endpoint 진입점 |
| `DesignPortalDrawingService.java` | 수기 도면, EQ 후보, Chamber, Spec option 조회 |
| `VcSimFacadeService.java` | 화면용 API 결과 조립, 계산 요청 변환, 결과 저장 응답 |
| `VcCalculationService.java` | 실제 계산 흐름: GUID 생성, 요청/부품/결과 저장, 판정 |
| `VcSpecMasterService.java` | Spec Master 조회와 판정용 Spec 조회 |
| `TxtTableRepository.java` | 미리보기 TXT DB 읽기/쓰기 |
| `DesignPortalDrawing.java` | 수기 도면 조회 DTO/Record |
| `VcSimCalculateRequest.java` | F/E calculate POST request DTO |
| `VcSimSaveRequest.java` | result/save POST request DTO |

---

## 3. 전체 아키텍처

```txt
Bim5DNotApplied.js
  ↓ dispatch(action)
nonBim action.js
  ↓
nonBim reducer.js
  ↓ state 변경
vcSimSaga.js
  ↓ call
vcSimApi.js
  ↓ fetch
Spring B/E VcSimController
  ↓ service
DesignPortalDrawingService / VcSimFacadeService / VcCalculationService
  ↓ response
vcSimSaga.js
  ↓ helper normalize
reducer / vcResult reducer
  ↓
화면 / 팝업 렌더링
```

핵심 원칙:

```txt
Component는 API를 직접 호출하지 않습니다.
Component는 action만 dispatch합니다.
Saga가 API를 호출합니다.
Reducer는 state만 바꿉니다.
Helper는 응답/요청 모양을 정리합니다.
Popup은 vcResult state를 보고 열립니다.
B/E는 Controller → Service → Repository/Calculation 순서로 처리합니다.
```

---

# 4. 화면 최초 진입: FAB/Pipe 옵션 조회

## 4.1 사용자가 보는 것

```txt
FAB select
EQ ID input + datalist
WO ID input
Reset
Search
```

## 4.2 F/E 시작점

파일: `Bim5DNotApplied.js`

```js
useEffect(() => {
  dispatch(nonBimActions.initOptionsRequest());
}, [dispatch]);
```

의미:

```txt
화면이 열리자마자 Non-BIM 화면에 필요한 옵션을 B/E에서 조회합니다.
주요 옵션은 FAB 목록과 Pipe Type 목록입니다.
```

## 4.3 Redux Action

파일: `src/store/vc/nonBim/action.js`

```js
initOptionsRequest: () => ({ type: NON_BIM_ACTION_TYPES.INIT_OPTIONS_REQUEST })
```

## 4.4 Reducer

파일: `src/store/vc/nonBim/reducer.js`

```js
case INIT_OPTIONS_REQUEST:
  return setLoading(state, "options", true);
```

성공 시:

```js
options: action.payload.options || initialNonBimState.options
```

여기에 들어가는 값:

```txt
options.fabs
options.pipeTypes
```

## 4.5 Saga

파일: `src/saga/vc/nonBim/vcSimSaga.js`

```js
const response = yield call(vcSimApi.getNonBimOptions);
yield put(nonBimActions.initOptionsSuccess(normalizeScreenOptions(response)));
```

## 4.6 API Adapter

파일: `src/service/api/vc/sim/vcSimApi.js`

```js
getNonBimOptions() {
  return requestCachedOptions("nonBimOptions", () => requestJson(VC_SIM_ENDPOINTS.nonBimOptions));
}
```

endpoint:

```txt
GET /api/vc/sim/non-bim/options
```

## 4.7 B/E

Controller:

```java
@GetMapping("/non-bim/options")
public Map<String, Object> nonBimOptions() {
    return simFacadeService.nonBimOptions();
}
```

Facade:

```java
return Map.of(
    "fabs", portalService.fabs().stream().map(this::option).toList(),
    "pipeTypes", pipeTypeOptions()
);
```

즉:

```txt
FAB 목록은 DesignPortalDrawingService.fabs()에서 가져옵니다.
Pipe Type은 B/E ObjectType enum에서 PIPE/ELBOW/REDUCER를 만듭니다.
```

---

# 5. EQ ID 입력 시 자동완성

## 5.1 사용자가 하는 일

```txt
EQ ID input에 EQ-VAC 입력
```

## 5.2 F/E 화면

파일: `Bim5DNotApplied.js`

```js
useEffect(() => {
  dispatch(nonBimActions.fetchEqSuggestionsRequest(search.eqId));
}, [dispatch, search.eqId]);
```

## 5.3 Saga

```js
yield delay(250);

if (!keyword || keyword.length < 2) {
  yield put(nonBimActions.fetchEqSuggestionsSuccess([]));
  return;
}

const response = yield call(vcSimApi.searchEqSuggestions, keyword);
```

설명:

```txt
사용자가 타이핑할 때마다 바로 API를 부르면 B/E가 너무 많이 호출됩니다.
그래서 250ms 기다렸다가 마지막 입력 기준으로 호출합니다.
1글자 이하면 후보를 비웁니다.
```

## 5.4 API Adapter

```js
searchEqSuggestions(keyword) {
  return requestJson(VC_SIM_ENDPOINTS.searchEqSuggestions, {
    params: { keyword },
  });
}
```

endpoint:

```txt
GET /api/vc/sim/non-bim/equipments?keyword=...
```

## 5.5 B/E Controller

```java
@GetMapping("/non-bim/equipments")
public List<Map<String, Object>> equipments(@RequestParam(required = false) String keyword) {
    return portalService.searchEquipmentSuggestions(keyword).stream()
        .map(row -> Map.of(
            "eqId", row.eqId(),
            "woId", row.woId(),
            "label", row.eqId() + " (" + row.fabCd() + " / " + row.area() + ")",
            "raw", row
        ))
        .toList();
}
```

## 5.6 B/E Service

```java
repository.selectAll(PORTAL_TABLE, DesignPortalDrawing.class).stream()
    .filter(row -> isBlank(keyword) || containsIgnoreCase(row.eqId(), keyword))
```

즉:

```txt
DESIGN_PORTAL_MANUAL_DRAWING.txt 전체를 읽고,
eqId에 keyword가 포함된 row를 후보로 반환합니다.
```

---

# 6. M16, EQ_ID 선택 후 Search 버튼 클릭

## 6.1 사용자가 하는 일

```txt
FAB: M16
EQ ID: EQ-VAC-ETCH-1001
Search 클릭
```

## 6.2 F/E validation

파일: `Bim5DNotApplied.js`

```js
if (!search.eqId.trim()) {
  setSearchValidationMessage("EQ ID는 필수 입력조건입니다.");
  return;
}
```

즉:

```txt
EQ ID가 비어 있으면 B/E API를 호출하지 않고 화면 오류만 보여줍니다.
```

## 6.3 Search action

```js
dispatch(nonBimActions.fetchManualDrawingsRequest());
```

## 6.4 Reducer

```js
case FETCH_MANUAL_DRAWINGS_REQUEST:
  return {
    ...setLoading(state, "drawings", true),
    drawings: [],
    selectedWoId: "",
    selectedDrawing: null,
    chambers: [],
    activeChamberId: "",
  };
```

설명:

```txt
새 검색을 시작하면 이전 검색 결과, 이전 선택 row, 이전 Chamber 탭을 초기화합니다.
이전 도면의 Chamber가 남아 있으면 사용자가 착각할 수 있기 때문입니다.
```

## 6.5 Saga

```js
const search = yield select(selectSearch);
const response = yield call(vcSimApi.searchManualDrawings, search);
yield put(nonBimActions.fetchManualDrawingsSuccess(normalizeDrawingList(response)));
```

## 6.6 API Adapter

```js
searchManualDrawings(params = {}) {
  return requestJson(VC_SIM_ENDPOINTS.searchManualDrawings, {
    params,
  });
}
```

endpoint:

```txt
GET /api/vc/sim/non-bim/manual-drawings?fabCd=M16&eqId=EQ-VAC-ETCH-1001&woId=...
```

## 6.7 B/E Controller

```java
@GetMapping("/non-bim/manual-drawings")
public List<DesignPortalDrawing> manualDrawings(
    @RequestParam(required = false) String fabCd,
    @RequestParam String eqId,
    @RequestParam(required = false) String woId
) {
    return portalService.searchManualDrawings(fabCd, eqId, woId);
}
```

## 6.8 B/E Service

```java
repository.selectAll(PORTAL_TABLE, DesignPortalDrawing.class).stream()
    .filter(row -> isBlank(fabCd) || equalsIgnoreCase(row.fabCd(), fabCd))
    .filter(row -> isBlank(eqId) || containsIgnoreCase(row.eqId(), eqId))
    .filter(row -> isBlank(woId) || containsIgnoreCase(row.woId(), woId))
```

## 6.9 F/E normalize

```js
export const normalizeDrawing = (raw = {}) => {
  const woId = nvl(raw.woId);
  const eqId = nvl(raw.eqId);

  return {
    id: [eqId, woId].filter(Boolean).join("_") || createId("DRAWING"),
    woId,
    eqId,
    siteCd,
    siteNm,
    fabCd,
    area,
    areaDetail,
    requestStatus,
    setModelNm,
    chamberCount,
    chambers,
    specOptions,
    raw,
  };
};
```

중요:

```txt
id는 React key입니다.
업무 키는 woId입니다.
상세 조회 안정키는 eqId + woId입니다.
```

---

# 7. Manual Drawing Results row 라디오 선택

## 7.1 사용자가 하는 일

```txt
VC-2026-ETCH-001 / EQ-VAC-ETCH-1001 row radio 선택
```

## 7.2 UI 코드

파일: `DrawingResultTable.js`

```js
<input
  type="radio"
  name="drawingRadio"
  checked={selected}
  onChange={() => onSelectDrawing(row.woId)}
/>
```

## 7.3 상위 화면 callback

```js
onSelectDrawing={(woId) => dispatch(nonBimActions.selectDrawing(woId))}
```

## 7.4 Reducer

```js
const drawing = state.drawings.find((item) => item.woId === action.payload.woId) || null;

return {
  ...setLoading(state, "chambers", Boolean(drawing)),
  selectedWoId: drawing?.woId || "",
  selectedDrawing: drawing,
  chambers: [],
  activeChamberId: "",
  error: null,
};
```

## 7.5 Saga가 호출하는 두 API

`SELECT_DRAWING` action은 saga에서 아래 두 API를 호출합니다.

```txt
1. GET /api/vc/sim/non-bim/chambers
2. GET /api/vc/sim/non-bim/equipment-spec-options
```

코드:

```js
const chamberResponse = yield call(vcSimApi.getDrawingChambers, buildEquipmentContextParams(drawing));
const rawChambers = toArray(chamberResponse);
const chambers = normalizeChambersFromDrawing({ ...drawing, chambers: rawChambers });
yield put(nonBimActions.fetchDrawingChambersSuccess({ woId, chambers }));

const options = yield call(vcSimApi.getEquipmentSpecOptions, buildEquipmentContextParams(drawing));
yield put(nonBimActions.fetchModelStandardOptionsSuccess({ woId, options }));
```

---

# 8. 사용자가 준 Java 로그 해석

```txt
[API][GET /api/vc/sim/non-bim/chambers] eqId=EQ-VAC-ETCH-1001 woId=VC-2026-ETCH-001
[SERVICE][PORTAL][SELECT] business=getDrawingChambers table=DESIGN_PORTAL_MANUAL_DRAWING eqId=... woId=...
[SERVICE][PORTAL][SELECT] business=findByBusinessKey table=DESIGN_PORTAL_MANUAL_DRAWING eqId=... woId=...
[TXT_DB][SELECT] table=DESIGN_PORTAL_MANUAL_DRAWING file=... rowType=DesignPortalDrawing rowCount=4

[API][GET /api/vc/sim/non-bim/equipment-spec-options] eqId=... fabCd=M16 setModelNm=VX-ETCH-300 woId=...
[SERVICE][PORTAL][SELECT] business=getEquipmentSpecOptions eqId=... fabCd=... setModelNm=... woId=...
[TXT_DB][SELECT] table=DESIGN_PORTAL_MANUAL_DRAWING file=... rowType=DesignPortalDrawing rowCount=4
[SERVICE][PORTAL][SELECT][DONE] source=designPortal optionCount=3
```

## 8.1 의미

| 로그 | 의미 |
|---|---|
| `GET /non-bim/chambers` | row 선택 후 Chamber 탭 데이터를 조회 |
| `getDrawingChambers` | Service에서 Chamber 목록 조회 시작 |
| `findByBusinessKey` | `eqId + woId`로 수기 도면 1건 찾기 |
| `TXT_DB SELECT rowCount=4` | TXT 파일에서 전체 4건을 읽음 |
| `GET /equipment-spec-options` | 같은 row 기준으로 Model Standard/Min/Max 옵션 조회 |
| `source=designPortal optionCount=3` | 선택 도면 row 안의 specOptions에서 3건 반환 |

## 8.2 초급자용 설명

```txt
라디오 버튼을 누르면 화면은 "이 WO의 Chamber와 Spec 정보를 주세요"라고 B/E에 요청합니다.
B/E는 TXT DB에서 eqId + woId로 수기 도면 row를 찾습니다.
그 row 안에 chambers와 specOptions가 있으면 그것을 F/E에 내려줍니다.
```

---

# 9. Chamber 탭명 가져올 때

## 9.1 B/E DTO

파일: `DesignPortalDrawing.java`

```java
public record Chamber(
    String chamberId,
    String chamberName,
    String modelStandard,
    String minSpec,
    String maxSpec,
    String operLargeCatgVal,
    String operMidCatgVal,
    List<PipeRow> pipeRows
)
```

탭명은 `chamberName`입니다.

## 9.2 B/E Service

```java
public List<DesignPortalDrawing.Chamber> getDrawingChambers(String eqId, String woId) {
    DesignPortalDrawing drawing = findByBusinessKey(eqId, woId);
    return drawing.chambers() == null ? List.of() : drawing.chambers();
}
```

## 9.3 F/E helper

```js
chamberName: nvl(raw.chamberName, createChamberName(index + 1))
```

즉:

```txt
B/E가 chamberName을 주면 그대로 탭명으로 사용합니다.
없으면 CHAMBER1, CHAMBER2 같은 기본 이름을 만듭니다.
```

## 9.4 locked 의미

```txt
B/E에서 조회한 Chamber: locked=true
사용자가 Add한 Chamber: locked=false
```

locked Chamber는 삭제할 수 없습니다.

---

# 10. Chamber 탭 선택

## 10.1 UI

```js
<button
  className={activeChamberId === chamber.id ? "tab active" : "tab"}
  onClick={() => onSetActiveChamber(chamber.id)}
>
  {chamber.chamberName}
</button>
```

## 10.2 Action/Reducer

```js
setActiveChamber(chamberId)
```

reducer:

```js
activeChamberId: action.payload.chamberId
```

## 10.3 API 호출 여부

```txt
Chamber 탭 클릭 자체는 API를 호출하지 않습니다.
이미 Redux에 조회된 chambers 중 activeChamberId만 바꿉니다.
```

## 10.4 Selector

```js
selectActiveChamber
→ findActiveChamber(current.chambers, current.activeChamberId)
```

active ID가 잘못되어도 첫 번째 Chamber를 fallback으로 반환해서 화면이 깨지지 않게 합니다.

---

# 11. Model Standard 가져올 때

## 11.1 API 호출 시점

Manual Drawing Results row 라디오 선택 직후, saga에서 Chamber 조회 다음에 Spec option 조회를 합니다.

```js
const options = yield call(vcSimApi.getEquipmentSpecOptions, buildEquipmentContextParams(drawing));
```

## 11.2 API Adapter

```js
getEquipmentSpecOptions({ eqId, fabCd, setModelNm, file, fileSeq, woId }) {
  return requestJson(VC_SIM_ENDPOINTS.equipmentSpecOptions, {
    params: { eqId, fabCd, setModelNm, file, fileSeq, woId },
  });
}
```

## 11.3 B/E Service 우선순위

```java
if (drawing != null && drawing.specOptions() != null && !drawing.specOptions().isEmpty()) {
    return drawing.specOptions();
}

return specMasterService.getSpecByEquipmentCondition(fabCd, setModelNm)
    .map(this::toSpecOption)
```

우선순위:

```txt
1순위: 선택한 Design Portal drawing row 안의 specOptions
2순위: VCW_VC_SPEC_MST에서 fabCd + setModelNm 기준 조회
```

## 11.4 F/E reducer 반영

```js
const nextModelStandard = chamber.modelStandard || options[0]?.value || "";
const spec = getSpecByValue(options, nextModelStandard);
const minSpec = spec ? spec.minSpec : chamber.minSpec;
const maxSpec = spec ? spec.maxSpec : chamber.maxSpec;
```

설명:

```txt
Chamber에 이미 modelStandard가 있으면 그것을 유지합니다.
없으면 옵션 목록의 첫 번째 값을 기본값으로 사용합니다.
선택된 modelStandard에 맞는 minSpec/maxSpec을 찾아서 세팅합니다.
```

---

# 12. Min Spec과 Max Spec 세팅

## 12.1 화면

파일: `ChamberWorkspace.js`

```js
<ReadonlyField label="Min Spec" value={activeChamber.minSpec} />
<ReadonlyField label="Max Spec" value={activeChamber.maxSpec} />
```

즉:

```txt
Min/Max는 사용자가 직접 입력하는 값이 아니라 읽기 전용 표시값입니다.
```

## 12.2 값이 들어오는 경우

| 경로 | 설명 |
|---|---|
| Chamber API 응답 | `chamber.modelStandard`, `chamber.minSpec`, `chamber.maxSpec` |
| Spec option API 응답 | 선택한 modelStandard에 맞는 option에서 min/max 세팅 |
| Model Standard 변경 | `applySpecToChamber`가 min/max를 다시 세팅 |

---

# 13. N/A가 되는 경우와 경고 표시

## 13.1 Result popup 안내 문구

파일: `VcResultPopup.js`

| 조건 | 문구 |
|---|---|
| Spec Out 존재 | `Spec Out Chamber가 있습니다. 최종결과저장 시 표준 기안 첨부가 필요합니다.` |
| N/A row 존재 | `산출대상 제외 또는 Spec 미적용 Chamber가 있습니다. 해당 row는 Conductance와 판정을 N/A로 표시합니다.` |
| 그 외 | `모든 Spec 판정이 IN입니다. 최종결과저장이 가능합니다.` |

## 13.2 N/A 판단

```js
row.judge === JUDGE.NA
|| row.calculationTarget === false
|| row.conductance === "N/A"
```

## 13.3 Non-BIM 계산 전 validation

Non-BIM은 기본적으로 Spec이 있어야 계산 대상이 됩니다.

```js
if (!chamber.modelStandard) {
  return { valid: false, message: `${chamber.chamberName} requires a Model Standard.` };
}

if (!chamber.minSpec && !chamber.maxSpec) {
  return { valid: false, message: `${chamber.chamberName} requires Min/Max Spec.` };
}
```

즉:

```txt
BIM/5D Not Applied Fab 화면은 Model Standard/Min/Max가 없는 Chamber를 계산 대상으로 켜고 계산할 수 없게 설계되어 있습니다.
```

---

# 14. Add Chamber 클릭

## 14.1 활성 조건

```js
canAddChamber={
  Boolean(selectedDrawing) &&
  !loading.chambers &&
  chambers.length < MAX_CHAMBER_COUNT
}
```

즉:

```txt
도면 row가 선택되어 있어야 합니다.
Chamber 조회 중이 아니어야 합니다.
최대 10개 미만이어야 합니다.
```

## 14.2 Reducer

```js
const chamber = createUserChamber(state.chambers, state.selectedDrawing);
const chambers = resequenceChambers([...state.chambers, chamber]);

return {
  ...state,
  chambers,
  activeChamberId: chamber.id,
};
```

## 14.3 Helper

```txt
createUserChamber는 선택 도면의 공정/Spec option을 상속합니다.
사용자가 추가한 Chamber이므로 locked=false입니다.
```

---

# 15. Remove 클릭

## 15.1 활성 조건

```js
canRemoveChamber={Boolean(activeChamber && !activeChamber.locked)}
```

즉:

```txt
B/E에서 온 원본 Chamber는 삭제할 수 없습니다.
사용자가 Add한 Chamber만 삭제할 수 있습니다.
```

## 15.2 Reducer

```js
if (!target || target.locked) return state;
```

삭제 후 현재 탭이 사라졌다면 남은 첫 번째 탭으로 이동합니다.

---

# 16. Pipe Row Add/Delete/수정

## 16.1 Add Pipe Row

```js
pipeList: [...chamber.pipeList, createEmptyPipeRow(PIPE_TYPE.PIPE)]
```

## 16.2 Delete Pipe Row

마지막 row를 삭제해도 빈 표가 되지 않게 기본 PIPE row 하나를 남깁니다.

```js
if (chamber.pipeList.length <= 1) {
  return {
    pipeList: [createEmptyPipeRow(PIPE_TYPE.PIPE)],
    selectedPipeRowId: "",
  };
}
```

## 16.3 Pipe Type별 입력 정책

| Type | 입력 가능 | 자동/비활성 |
|---|---|---|
| PIPE | 입구내경, 길이 | 수량 1 고정, 각도/출구내경 비활성 |
| ELBOW | 입구내경, 각도, 수량 | 길이/출구내경 비활성 |
| REDUCER | 입구내경, 길이, 출구내경 | 수량 1 고정, 각도 비활성 |

Reducer에서 type 변경 시 `normalizePipeRowByType`이 사용하지 않는 값을 비웁니다.

---

# 17. Calculate 버튼 클릭

## 17.1 버튼 잠금

특정 도면 상태이면 Calculate 버튼을 숨깁니다.

```txt
Saved
Draft Attached
```

## 17.2 Action

```js
dispatch(nonBimActions.calculateRequest())
```

## 17.3 Validation

```txt
1. selectedDrawing 존재
2. chambers 존재
3. 최소 하나 이상의 calculationTarget 존재
4. 계산 대상 Chamber는 Model Standard 필수
5. 계산 대상 Chamber는 Min/Max Spec 필수
6. pipeList 필수
7. Pipe Type별 필수값 필수
```

## 17.4 Payload 생성

파일: `NonBim.helper.js`

```js
buildNonBimCalculatePayload(state)
```

구조:

```json
{
  "sourceType": "NON_BIM",
  "woId": "VC-2026-ETCH-001",
  "search": {
    "fabCd": "M16",
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001"
  },
  "equipment": {
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001",
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300"
  },
  "chambers": [
    {
      "seq": 1,
      "chamberId": "CH-01",
      "chamberName": "CHAMBER1",
      "calculationTarget": true,
      "modelStandard": "...",
      "minSpec": "...",
      "maxSpec": "...",
      "isSpecSkipped": false,
      "pipeList": []
    }
  ]
}
```

## 17.5 API 호출

```txt
POST /api/vc/sim/non-bim/calculate
```

---

# 18. B/E Calculate 처리

## 18.1 Controller

```java
@PostMapping("/non-bim/calculate")
public Map<String, Object> calculateNonBim(@RequestBody VcSimCalculateRequest request) {
    return simFacadeService.calculate(request);
}
```

## 18.2 Facade

```java
CalculateResponse saved =
  calculationService.calculateVcRequest(toCalculateRequest(payload, fabCd, eqId, woId));
```

즉:

```txt
화면용 VcSimCalculateRequest
→ 계산 서비스용 CalculateRequest
→ VcCalculationService
```

## 18.3 VcCalculationService 흐름

```txt
STEP 1. GUID 생성
STEP 2. EQUIPMENT request header 생성
STEP 3. COMPONENT rows 저장
STEP 4. conductance 계산, SPEC 선택, chamber별 judge
STEP 5. CHAMBER result rows 저장
STEP 6. EQUIPMENT SPEC_YN 업데이트
```

## 18.4 현재 미리보기 Conductance 계산

```txt
PIPE    = inlet * 9 - length * 0.012
ELBOW   = inlet * 6 - angle * 0.06 - qty * 2.2
REDUCER = outlet * 7 - length * 0.01
```

최종값은 1 이상으로 보정하고 소수점 2자리로 반올림합니다.

## 18.5 Spec 판정

```txt
1. VCW_VC_SPEC_MST에서 fabId + setModelNm + chamberModelNm 완전 일치 Spec 조회
2. 없으면 화면에서 넘어온 Min/Max snapshot 사용
3. Spec skipped 또는 Min/Max 모두 없으면 NA
```

---

# 19. Vacuum Conductance Result 팝업 오픈

## 19.1 Saga

```js
const result = normalizeCalculationResult(response, payload);

yield put(nonBimActions.calculateSuccess(result));
yield put(vcResultActions.openResultPopup(result));
```

## 19.2 Result reducer

```js
visible: true,
sourceType: result.sourceType || "",
basicInfo: result.basicInfo || null,
rows: result.rows || [],
draftPopup: { visible: false, title: "", attachmentName: "", comment: "" }
```

## 19.3 Popup 표시

파일: `VcResultPopup.js`

```txt
기본정보: FAB, MODEL, EQ ID
결과정보: Chamber ID, 공정대분류, 공정중분류, 모델관리기준, Min, Max, Conductance, 판정
```

---

# 20. 최종결과저장: Spec IN이라서 바로 저장되는 경우

## 20.1 사용자 동작

```txt
Result Popup에서 최종결과저장 클릭
```

## 20.2 Reducer 분기

```js
if (needsDraftAttachment(state)) {
  draftPopup.visible = true;
} else {
  loading.save = true;
}
```

Spec IN이면 `needsDraftAttachment=false`입니다.

## 20.3 Save saga

```js
const response = yield call(vcSimApi.saveVcResult, {
  sourceType: state.sourceType,
  basicInfo: state.basicInfo,
  rows: state.rows,
  draft: state.draftPopup,
});
```

## 20.4 B/E save

```java
@PostMapping("/result/save")
public Map<String, Object> saveResult(@RequestBody VcSimSaveRequest request) {
    return simFacadeService.saveResult(request);
}
```

응답 예:

```txt
savedId=VC-SAVE-...
draftAttached=false
nextStatus=Saved
```

## 20.5 저장 성공 후

```txt
결과 팝업 닫힘
기안 팝업 닫힘
savedInfo에 저장 응답 보관
```

---

# 21. 저장 시 경고/오류 표현

## 21.1 검색 validation

EQ ID가 없으면:

```txt
EQ ID는 필수 입력조건입니다.
```

## 21.2 계산 validation

예:

```txt
Select a drawing before calculating.
CHAMBER1 requires a Model Standard.
CHAMBER1 requires Min/Max Spec.
CHAMBER1 has missing required PIPE values.
```

## 21.3 API 연결 실패

`vcSimApi.js`에서 B/E 연결 실패 시:

```txt
B/E API에 연결할 수 없습니다. Eclipse/STS에서 B/E가 8090 포트로 실행 중인지 확인해 주세요.
```

## 21.4 Result popup 업무 안내

| 상황 | 문구 |
|---|---|
| Spec Out | 표준 기안 첨부 필요 |
| N/A row | 산출대상 제외 또는 Spec 미적용 안내 |
| 모두 IN | 최종결과저장 가능 안내 |

---

# 22. Spec Out이면 표준 기안 첨부로 빠지는 경우

## 22.1 Spec Out 판단

```js
row.judge === "HIGH_OUT" || row.judge === "LOW_OUT"
```

## 22.2 기안 첨부 필요 조건

```js
hasSpecOut(state.rows) &&
state.sourceType === "NON_BIM" &&
(!state.draftPopup.title.trim() || !state.draftPopup.attachmentName.trim())
```

## 22.3 저장 버튼 첫 클릭

```txt
저장 API 호출 X
draftPopup.visible=true
표준 기안 첨부 팝업 오픈
```

saga도 같은 조건이면 return해서 저장 API 호출을 막습니다.

---

# 23. 표준 기안 첨부 팝업에서 기안첨부 후 저장

## 23.1 팝업 필드

```txt
기안 제목
첨부 파일
Comment
```

## 23.2 입력값 저장

```js
dispatch(vcResultActions.setDraftField({ name, value }))
```

## 23.3 첨부 파일

```js
const fileName = event.target.files?.[0]?.name || "";
dispatch(vcResultActions.setDraftField({ name: "attachmentName", value: fileName }));
```

중요:

```txt
현재 미리보기는 파일 본문이 아니라 파일명만 payload에 담습니다.
운영에서는 attachmentId 또는 multipart 업로드 정책이 필요합니다.
```

## 23.4 버튼 활성 조건

```js
Boolean(draftPopup.title.trim() && draftPopup.attachmentName.trim())
```

## 23.5 저장 payload

```json
{
  "sourceType": "NON_BIM",
  "basicInfo": {},
  "rows": [],
  "draft": {
    "title": "Spec Out 표준 기안",
    "attachmentName": "review.pdf",
    "comment": "Spec Out 사유"
  }
}
```

## 23.6 B/E 응답

```txt
draftAttached=true
nextStatus=Draft Attached
```

---

# 24. Foreline Download 흐름

## 24.1 UI

```js
<button onClick={() => onDownload(row.woId)}>
  Download
</button>
```

## 24.2 Saga

```js
const drawing = drawings.find((item) => item.woId === woId);
const blob = yield call(vcSimApi.downloadForelineDrawing, buildForelineDownloadParams(drawing));
yield call(downloadBlob, blob, buildFileDownloadName(drawing));
```

## 24.3 B/E

```java
@GetMapping("/non-bim/foreline-drawing/download")
public ResponseEntity<byte[]> downloadForeline(...)
```

현재는 실제 파일 대신 미리보기 text를 만들어 내려줍니다.

---

# 25. TXT DB 구조

현재 B/E는 실제 Oracle DB가 아니라 TXT 파일을 DB처럼 사용합니다.

```java
Files.readAllLines(path, StandardCharsets.UTF_8)
objectMapper.readValue(line, rowType)
```

즉:

```txt
TXT 파일 한 줄 = JSON row 한 건
각 줄을 Java record로 변환
```

운영 전환 시:

```txt
TxtTableRepository
→ MyBatis Mapper / JPA Repository
→ Oracle table
```

---

# 26. 초급 개발자용 설명 스크립트

```txt
BIM/5D Not Applied Fab 화면은 수기 도면 기반 V/C 계산 화면입니다.

화면이 열리면 옵션 API로 FAB와 Pipe Type을 조회합니다.
사용자가 EQ ID를 입력하면 EQ 자동완성 API를 호출하고,
Search를 누르면 eqId/fabCd/woId 조건으로 Manual Drawing Results를 조회합니다.

그리드에서 row를 선택하면 row.woId와 eqId를 기준으로
Chamber API와 Equipment Spec Options API를 호출합니다.
Chamber API는 탭명과 Pipe Rows를 내려주고,
Spec API는 Model Standard와 Min/Max Spec을 내려줍니다.

하단 ChamberWorkspace는 Chamber 탭, Model Standard, Min/Max, Pipe Rows를 보여줍니다.
사용자는 Chamber나 Pipe row를 추가/삭제/수정할 수 있지만,
B/E에서 온 원본 Chamber는 locked 상태라 삭제할 수 없습니다.

Calculate 버튼을 누르면 saga가 현재 Redux state를 읽고 validation을 수행합니다.
검증이 통과하면 helper가 Non-BIM calculate payload를 만들고,
POST /api/vc/sim/non-bim/calculate로 B/E에 보냅니다.

B/E는 Controller에서 요청을 받고 VcSimFacadeService를 거쳐 VcCalculationService에서
GUID 생성, Equipment header 저장, Component 저장, Conductance 계산, Spec 판정,
Chamber 결과 저장, SPEC_YN 업데이트 순서로 처리합니다.

응답 rows는 F/E helper에서 결과 팝업 모델로 normalize되고,
VcResultPopup이 열립니다.
모든 결과가 IN이면 최종결과저장 버튼으로 바로 저장됩니다.
Spec Out이 있으면 표준 기안 첨부 팝업을 먼저 열고,
기안 제목과 첨부 파일을 입력한 뒤 저장 API를 호출합니다.
```

---

# 27. 추가 개선/주의 포인트

## 27.1 `woId` vs `constructionNo` 용어 정리

현재 구현은 `woId` 중심입니다. 문서/회의에서 `constructionNo`가 남아 있으면 아래처럼 정리하는 것이 좋습니다.

```txt
현재 구현 기준: woId
업무상 공사번호 표현: WO ID
```

## 27.2 `DRAWING_ID` 쓰지 않기

```txt
F/E row.id는 React key일 뿐입니다.
B/E query에는 eqId, woId를 사용합니다.
DRAWING_ID는 현재 계약의 핵심 키가 아닙니다.
```

## 27.3 Model Standard 자동 기본 선택 정책 검토

현재 Non-BIM은 옵션 조회 성공 시 Chamber에 modelStandard가 없으면 첫 번째 option을 기본값으로 넣습니다.

```js
const nextModelStandard = chamber.modelStandard || options[0]?.value || "";
```

업무적으로 자동 선택이 위험하면 사용자가 직접 선택하게 비워두는 방식이 더 안전합니다.

## 27.4 저장 후 Manual Drawing Results 상태 갱신

현재 저장 성공 후 popup은 닫히지만, 상단 그리드 `requestStatus`를 즉시 갱신하는 흐름은 명확하지 않습니다.

개선안:

```txt
save 성공 후 nextStatus가 Saved/Draft Attached면
1. selectedDrawing.requestStatus 갱신
또는
2. manual-drawings 재조회
```

## 27.5 표준 기안 첨부 실제 파일 업로드

현재는 파일 본문이 아니라 파일명만 저장합니다.

운영 개선안:

```txt
파일 업로드 API → attachmentId 받기 → result/save에 attachmentId 전달
또는 result/save를 multipart/form-data로 변경
```

## 27.6 Helper 분리

`NonBim.helper.js`는 현재 많은 일을 합니다.

```txt
정규화
validation
payload build
다운로드
결과 normalize
```

운영 규모가 커지면 분리 추천:

```txt
NonBim.mapper.js
NonBim.validation.js
NonBim.payload.js
download.helper.js
result.mapper.js
```

## 27.7 CSS className 충돌

`center` 같은 일반 className은 회사 공통 CSS와 충돌할 수 있습니다.

개선안:

```txt
center → vc-center
table-wrap → vc-table-wrap
```

---

# 28. 최종 요약

```txt
화면 진입
→ 옵션 조회

EQ 입력
→ 자동완성 조회

Search
→ 수기 도면 목록 조회

Row radio 선택
→ Chamber 조회
→ Spec option 조회

Chamber 탭 선택
→ Redux activeChamberId만 변경

Model Standard 변경
→ reducer에서 Min/Max 자동 세팅

Add/Remove
→ unlocked Chamber만 추가/삭제 가능

Calculate
→ validation
→ calculate payload 생성
→ B/E 계산
→ 결과 popup open

Spec IN 저장
→ result/save 즉시 호출

Spec Out 저장
→ 표준 기안 첨부 popup
→ 기안 정보 입력
→ result/save 호출
```

이 화면의 본질:

```txt
도면 row를 선택해서 Chamber/Pipe 입력값을 만들고,
그 입력값을 B/E 계산 서비스에 보내 Conductance와 Spec 판정을 받아,
결과를 저장하거나 Spec Out이면 기안 첨부로 넘기는 화면입니다.
```
