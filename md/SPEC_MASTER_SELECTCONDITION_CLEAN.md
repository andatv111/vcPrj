# Spec Master `selectcondition` 조회 개선안

구분: SPEC 마스터  
대상 API: `POST /api/vc/specmaster/selectcondition`  
기준 브랜치: `codex-work`  
목적: `normalizeSpecRow`, 불필요한 response fallback, 불필요한 Detail 선택 유지 값을 줄이고 Java JSON 계약 기준으로 조회 흐름을 단순화한다.

---

## 1. 결론 요약

기존 구조는 B/E 응답 필드명이 흔들릴 수 있다는 전제로 `normalizeSpecRow()`에서 여러 필드명을 방어적으로 보정했다.

```txt
specNm || specName
fabId  || fabCd
setModelNm || model
operLargeCatgVal || processLarge
```

하지만 현재 Java `SpecMaster`가 `specId`, `specNm`, `fabId`, `setModelNm`, `upperCd` 등 정식 camelCase JSON으로 내려주는 구조라면 F/E에서 row 필드명을 다시 가공할 필요가 없다.

따라서 조회 흐름은 아래처럼 정리한다.

```txt
화면 조회조건 3개 변경
  ↓
Redux search state 저장
  ↓
조회 버튼 클릭
  ↓
SEARCH_REQUEST dispatch
  ↓
Saga가 search state 읽음
  ↓
API adapter가 POST body 생성
  ↓
Controller가 @RequestBody 수신
  ↓
Service가 Master 조회 + 선택 Master의 Detail 조회
  ↓
Saga가 Java JSON을 그대로 Redux에 저장
```

---

## 2. 최종 요청/응답 구조

### Request Body

```json
{
  "tabId": "SPEC_MASTER",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "specNm": "Litho",
  "selectedSpecId": "SPEC-M14-LITHO-A"
}
```

| Field | 설명 |
| --- | --- |
| `tabId` | 화면 구분 고정값. `SPEC_MASTER` |
| `fabId` | 상단 조회조건 FAB |
| `setModelNm` | 상단 조회조건 MODEL |
| `specNm` | 상단 조회조건 모델관리기준명 |
| `selectedSpecId` | 조회 후 기존 선택 Master를 유지하기 위한 값 |

`selectedDetailSpecId`는 조회 API에서 제거한다. 현재 Java 조회 로직에서 Detail 선택값을 검증하지 않기 때문이다. 조회 후 Detail 선택값은 빈 값으로 초기화한다.

### Response Body

```json
{
  "rows": [
    {
      "specId": "SPEC-M14-LITHO-A",
      "specNm": "M14 Litho Track",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "upperCd": "",
      "specMinVal": 36,
      "specMaxVal": 90,
      "chgrNm": "S. Choi"
    }
  ],
  "details": [
    {
      "specId": "SPEC-M14-LITHO-A-CH01",
      "specNm": "M14 Litho Develop Chamber",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "upperCd": "SPEC-M14-LITHO-A",
      "operLargeCatgVal": "LITHO",
      "operMidCatgVal": "Developer",
      "chambModelNm": "LITHO-DEV-03",
      "specMinVal": 41,
      "specMaxVal": 89
    }
  ],
  "page": 0,
  "size": 10,
  "totalPages": 1,
  "totalElements": 1,
  "selectedSpecId": "SPEC-M14-LITHO-A",
  "selectedDetailSpecId": ""
}
```

---

## 3. 한눈에 보는 파일별 역할

| 구간 | 파일 | 역할 |
| --- | --- | --- |
| 화면 | `src/components/vc/admin/specMaster/SpecMgmt.js` | 상단 조회조건 변경, 조회 버튼 클릭 |
| Redux Action | `src/store/vc/vcMgmt/action.js` | `SEARCH_REQUEST`, `SEARCH_SUCCESS` 정의 |
| Redux Reducer | `src/store/vc/vcMgmt/reducer.js` | search state 저장, 조회 결과 저장 |
| Selector | `src/store/vc/vcMgmt/vcSpecMgmtSelector.js` | Saga가 search state 읽기 |
| Saga | `src/saga/vc/admin/vcSpecSaga.js` | 조회 action 수신, API 호출, 결과 저장 |
| API Adapter | `src/service/api/vc/admin/vcSpecApi.js` | POST body 생성, `/selectcondition` 호출 |
| Controller | `vcBePrj/src/main/java/com/example/vcbeprj/controller/VcSpecMasterController.java` | request body 수신, service 호출, response 반환 |
| Service | `vcBePrj/src/main/java/com/example/vcbeprj/service/VcSpecMasterService.java` | Master/Detail 실제 조회 |

---

## 4. 화면단 개선 코드

파일: `src/components/vc/admin/specMaster/SpecMgmt.js`

### 4.1 상단 조회조건

```jsx
<SelectField
  label="FAB"
  value={search.fabId}
  options={options.fabIds}
  onChange={(value) => onChange("fabId", value)}
/>

<SelectField
  label="MODEL"
  value={search.setModelNm}
  options={modelOptions}
  onChange={(value) => onChange("setModelNm", value)}
/>

<SelectField
  label="모델관리기준명"
  value={search.specNm}
  options={options.specNms}
  onChange={(value) => onChange("specNm", value)}
/>
```

상단 조회조건 3개는 Redux `search` state에 저장된다.

```txt
FAB             → search.fabId
MODEL           → search.setModelNm
모델관리기준명   → search.specNm
```

### 4.2 조회 버튼

```jsx
<button type="button" className="search-button btn_small" onClick={onSearch}>
  {loading.search ? "조회 중..." : "조회"}
</button>
```

### 4.3 조회 버튼 dispatch

```jsx
<SearchPanel
  search={search}
  options={options}
  loading={loading}
  onChange={(name, value) => dispatch(specMasterActions.setSearchField(name, value))}
  onReset={() => dispatch(specMasterActions.resetSearch())}
  onSearch={() => dispatch(specMasterActions.searchRequest())}
/>
```

조회 버튼은 payload를 직접 만들지 않는다.  
조회조건 payload는 Saga/API adapter에서 Redux search state를 읽어 만든다.

---

## 5. Redux Action 개선 코드

파일: `src/store/vc/vcMgmt/action.js`

```js
export const SPEC_MASTER_ACTION_TYPES = {
  SET_SEARCH_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_SEARCH_FIELD`,
  RESET_SEARCH: `${SPEC_MASTER_ACTION_PREFIX}/RESET_SEARCH`,
  SEARCH_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_REQUEST`,
  SEARCH_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_SUCCESS`,
  SEARCH_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_FAILURE`,
};
```

```js
export const specMasterActions = {
  setSearchField: (name, value) => ({
    type: SPEC_MASTER_ACTION_TYPES.SET_SEARCH_FIELD,
    payload: { name, value },
  }),

  resetSearch: () => ({
    type: SPEC_MASTER_ACTION_TYPES.RESET_SEARCH,
  }),

  searchRequest: ({ selectedSpecId } = {}) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST,
    payload: { selectedSpecId },
  }),

  searchSuccess: ({ rows, details, page, selectedSpecId, selectedDetailSpecId }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS,
    payload: {
      rows,
      details,
      page,
      selectedSpecId,
      selectedDetailSpecId,
    },
  }),

  searchFailure: (message) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_FAILURE,
    payload: { message },
  }),
};
```

`selectedDetailSpecId`는 `searchRequest`에서 제거한다.  
조회 API에서 Detail 선택값을 유지하지 않기 때문이다.

---

## 6. Redux Reducer 개선 코드

파일: `src/store/vc/vcMgmt/reducer.js`

### 6.1 search 기본값

```js
const DEFAULT_SEARCH = {
  fabId: "",
  setModelNm: "",
  specNm: "",
};
```

### 6.2 조회조건 변경

```js
case SPEC_MASTER_ACTION_TYPES.SET_SEARCH_FIELD: {
  const { name, value } = action.payload;

  const nextSearch = {
    ...state.search,
    [name]: value,
  };

  if (name === "fabId") {
    nextSearch.setModelNm = "";
  }

  return {
    ...state,
    search: nextSearch,
  };
}
```

FAB이 바뀌면 기존 MODEL은 초기화한다.  
다른 FAB의 MODEL 값이 남아서 잘못 조회되는 것을 막기 위함이다.

### 6.3 조회 요청

```js
case SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST:
  return {
    ...state,
    loading: {
      ...state.loading,
      search: true,
    },
    error: "",
  };
```

### 6.4 조회 성공

```js
case SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS: {
  const {
    rows,
    details,
    page,
    selectedSpecId,
    selectedDetailSpecId,
  } = action.payload;

  return {
    ...state,
    masterRows: rows,
    detailRows: details,
    page,
    selectedSpecId,
    selectedDetailSpecId,
    loading: {
      ...state.loading,
      search: false,
      details: false,
    },
    error: "",
  };
}
```

---

## 7. Selector 코드

파일: `src/store/vc/vcMgmt/vcSpecMgmtSelector.js`

```js
export const selectSpecMgmtState = (state) => state?.vc?.specMaster || initialSpecMasterState;

export const selectSpecMgmtSearch = (state) => selectSpecMgmtState(state).search;
```

Saga는 `selectSpecMgmtSearch`로 상단 조회조건 3개를 읽는다.

---

## 8. Saga 개선 코드

파일: `src/saga/vc/admin/vcSpecSaga.js`

### 8.1 조회 flow

`normalizeSpecRow()`를 제거하고 Java JSON을 그대로 사용한다.

```js
function* loadSpecConditionFlow(action = {}) {
  try {
    const search = yield select(selectSpecMgmtSearch);
    const state = yield select(selectSpecMgmtState);

    const requestedSpecId = action.payload?.selectedSpecId ?? state.selectedSpecId;

    const response = yield call(vcSpecApi.selectCondition, {
      search,
      selectedSpecId: requestedSpecId,
    });

    const masterRows = response.rows ?? [];
    const detailRows = response.details ?? [];

    yield put(specMasterActions.searchSuccess({
      rows: masterRows,
      details: detailRows,
      page: {
        page: response.page ?? 0,
        size: response.size ?? masterRows.length,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? masterRows.length,
      },
      selectedSpecId: response.selectedSpecId ?? "",
      selectedDetailSpecId: response.selectedDetailSpecId ?? "",
    }));
  } catch (error) {
    yield put(specMasterActions.searchFailure(getErrorMessage(error)));
  }
}
```

### 8.2 Master 선택 시 Detail 조회

```js
function* selectMasterFlow(action) {
  if (action.payload.specId) {
    try {
      const state = yield select(selectSpecMgmtState);

      const details = yield call(vcSpecApi.getChildren, action.payload.specId);

      yield put(specMasterActions.searchSuccess({
        rows: state.masterRows,
        details: details ?? [],
        page: state.page,
        selectedSpecId: action.payload.specId,
        selectedDetailSpecId: "",
      }));
    } catch (error) {
      yield put(specMasterActions.searchFailure(getErrorMessage(error)));
    }
  }
}
```

### 8.3 watcher

```js
export function* watchSpecSaga() {
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.INIT_REQUEST, initSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST, loadSpecConditionFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.CHANGE_PAGE, loadSpecConditionFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SELECT_MASTER, selectMasterFlow);
}
```

---

## 9. API Adapter 개선 코드

파일: `src/service/api/vc/admin/vcSpecApi.js`

### 9.1 endpoint

```js
export const VC_SPEC_ENDPOINTS = {
  selectCondition: "/api/vc/specmaster/selectcondition",
  selectFilterOptions: "/api/vc/specmaster/selectfilteroptions",
  specById: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}`,
  children: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}/children`,
};
```

### 9.2 selectCondition

```js
selectCondition({ search, selectedSpecId }) {
  return requestJson(VC_SPEC_ENDPOINTS.selectCondition, {
    method: "POST",
    body: {
      tabId: "SPEC_MASTER",
      fabId: search.fabId,
      setModelNm: search.setModelNm,
      specNm: search.specNm,
      selectedSpecId,
    },
  });
}
```

여기서 화면 상단 조회조건 3개가 최종 body에 들어간다.

```txt
search.fabId      → fabId
search.setModelNm → setModelNm
search.specNm     → specNm
```

`selectedDetailSpecId`는 전송하지 않는다.

---

## 10. Controller 개선 코드

파일: `vcBePrj/src/main/java/com/example/vcbeprj/controller/VcSpecMasterController.java`

```java
@PostMapping("/selectcondition")
public Map<String, Object> selectCondition(@RequestBody(required = false) Map<String, Object> payload) {
    Map<String, Object> body = payload == null ? Map.of() : payload;

    int page = number(body, "page", 0);
    int size = number(body, "size", 10);

    log.info("[API][POST /api/vc/specmaster/selectcondition] page={} size={} body={}", page, size, body);

    List<SpecMaster> searchedMasters = specMasterService.searchMasters(
            text(body, "fabId"),
            text(body, "setModelNm"),
            text(body, "specNm")
    );

    Map<String, Object> result = allRows(searchedMasters, page, size);

    @SuppressWarnings("unchecked")
    List<SpecMaster> masterRows = (List<SpecMaster>) result.get("rows");

    String requestedSpecId = text(body, "selectedSpecId");

    String selectedSpecId = masterRows.stream()
            .filter(row -> equalsText(row.specId(), requestedSpecId))
            .findFirst()
            .map(SpecMaster::specId)
            .orElse(masterRows.isEmpty() ? "" : masterRows.get(0).specId());

    result.put("selectedSpecId", selectedSpecId);
    result.put("selectedDetailSpecId", "");
    result.put("details", selectedSpecId.isBlank() ? List.of() : specMasterService.getChildren(selectedSpecId));

    return result;
}
```

### 핵심

```java
text(body, "fabId")
text(body, "setModelNm")
text(body, "specNm")
```

Controller는 F/E에서 받은 조회조건 3개만 Master 조회조건으로 사용한다.

```java
String requestedSpecId = text(body, "selectedSpecId");
```

`selectedSpecId`는 조회조건이 아니라 선택 유지용이다.

---

## 11. Service 조회 기준

파일: `vcBePrj/src/main/java/com/example/vcbeprj/service/VcSpecMasterService.java`

```java
public List<SpecMaster> searchMasters(String fabId, String setModelNm, String specNm) {
    return rows.stream()
            .filter(row -> isBlank(row.upperCd()))
            .filter(row -> isBlank(fabId) || equalsText(row.fabId(), fabId))
            .filter(row -> isBlank(setModelNm) || equalsText(row.setModelNm(), setModelNm))
            .filter(row -> isBlank(specNm) || containsText(row.specNm(), specNm))
            .sorted(Comparator
                    .comparing(SpecMaster::fabId, Comparator.nullsLast(String::compareToIgnoreCase))
                    .thenComparing(SpecMaster::setModelNm, Comparator.nullsLast(String::compareToIgnoreCase))
                    .thenComparing(SpecMaster::specNm, Comparator.nullsLast(String::compareToIgnoreCase)))
            .toList();
}
```

| 조건 | 의미 |
| --- | --- |
| `isBlank(row.upperCd())` | Master row만 조회 |
| `fabId` | FAB 정확히 일치 |
| `setModelNm` | MODEL 정확히 일치 |
| `specNm` | 모델관리기준명 포함 검색 |

```java
public List<SpecMaster> getChildren(String parentSpecId) {
    return rows.stream()
            .filter(row -> equalsText(row.upperCd(), parentSpecId))
            .toList();
}
```

Detail은 `upperCd = parentSpecId` 기준으로 조회한다.

---

## 12. `selectedSpecId`를 보내고 다시 받는 이유

`selectedSpecId`는 검색조건이 아니다.  
조회 후 기존 선택 Master row를 유지하기 위한 값이다.

예시:

```txt
현재 선택 row: SPEC-M14-LITHO-A
조회 버튼 클릭
B/E에 selectedSpecId 전달
B/E가 조회 결과 rows 안에 해당 specId가 있는지 확인
있으면 그대로 선택 유지
없으면 첫 번째 Master row를 selectedSpecId로 반환
```

Controller 기준:

```java
String selectedSpecId = masterRows.stream()
        .filter(row -> equalsText(row.specId(), requestedSpecId))
        .findFirst()
        .map(SpecMaster::specId)
        .orElse(masterRows.isEmpty() ? "" : masterRows.get(0).specId());
```

Saga는 B/E가 확정한 `selectedSpecId`를 Redux에 저장한다.

```js
selectedSpecId: response.selectedSpecId ?? ""
```

---

## 13. `Array.isArray`를 제거하거나 줄이는 기준

기존 방어 코드:

```js
const masterRows = Array.isArray(response.rows) ? response.rows : [];
const detailRows = Array.isArray(response.details) ? response.details : [];
```

이 코드는 `rows`나 `details`가 배열이 아닐 때 `.map()`이나 grid 처리 오류를 막기 위한 방어 코드다.

하지만 Java 응답 계약이 항상 아래처럼 보장된다면:

```json
{
  "rows": [],
  "details": []
}
```

아래처럼 단순화할 수 있다.

```js
const masterRows = response.rows ?? [];
const detailRows = response.details ?? [];
```

`?? []`는 `null` 또는 `undefined`일 때만 빈 배열로 대체한다.

---

## 14. 제거 대상 코드

아래 함수는 제거 가능하다.

```js
const normalizeSpecRow = (row = {}, index = 0) => ({
  id: row.specId || row.id || `SPEC_ROW_${index + 1}`,
  specId: row.specId || row.id || "",
  no: row.no || index + 1,
  specNm: row.specNm || row.specName || "",
  fabId: row.fabId || row.fabCd || "",
  area: row.area || row.zoneCd || "",
  maker: row.maker || row.makerVal || "",
  setModelNm: row.setModelNm || row.model || "",
  operLargeCatgVal: row.operLargeCatgVal || row.processLarge || "",
  operMidCatgVal: row.operMidCatgVal || row.processMiddle || "",
  chambModelNm: row.chambModelNm || row.chamberSpec || "",
  modelSpecUseYn: row.modelSpecUseYn || "0",
  srcGbnCd: row.srcGbnCd || "U",
  detSearYn: row.detSearYn || "N",
  upperCd: row.upperCd || "",
  mgmtTgtYn: row.mgmtTgtYn || "Y",
  specMinVal: row.specMinVal ?? "",
  specMaxVal: row.specMaxVal ?? "",
  chgrEmpno: row.chgrEmpno || "",
  chgrNm: row.chgrNm || "",
  specDesc: row.specDesc || "",
  raw: row,
});
```

아래 조회 코드도 제거한다.

```js
const allRows = toArray(response.rows || response.content || response);
const rows = allRows.map(normalizeSpecRow).filter((row) => !row.upperCd);
const details = toArray(response.details).map(normalizeSpecRow);
```

개선 후에는 아래만 사용한다.

```js
const masterRows = response.rows ?? [];
const detailRows = response.details ?? [];
```

---

## 15. 최종 정리

```txt
화면 조회조건 3개
  FAB             → fabId
  MODEL           → setModelNm
  모델관리기준명   → specNm

조회 선택 유지값
  selectedSpecId  → Master 선택 유지용

제거
  normalizeSpecRow
  selectedDetailSpecId request 전달
  response.rows || response.content || response fallback
  row.specName, row.fabCd, row.model 같은 필드명 fallback

유지
  Java camelCase JSON 계약
  rows/details 배열 응답
  selectedSpecId B/E 확정 반환
  selectedDetailSpecId는 조회 후 빈 값
```

개선 방향은 단순하다.

```txt
B/E가 정확한 JSON을 준다.
F/E는 그 JSON을 믿고 그대로 Redux에 넣는다.
F/E는 화면 상태 유지에 필요한 selectedSpecId만 주고받는다.
```