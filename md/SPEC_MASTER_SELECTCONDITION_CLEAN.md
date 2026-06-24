# Spec Master `selectcondition` 조회 개선안

구분: SPEC 마스터  
대상 API: `POST /api/vc/specmaster/selectcondition`  
기준 브랜치: `codex-work`  
전제: Java B/E가 계약된 JSON 구조를 정확히 내려준다.  
목적: F/E에서 불필요한 row 가공과 방어 코딩을 줄이고, 조회 흐름을 단순하게 이해할 수 있게 정리한다.

---

## 1. 핵심 결론

이 개선안은 아래 두 가지를 전제로 한다.

```txt
1. Java가 rows, details를 항상 배열로 내려준다.
2. Java가 SpecMaster 필드명을 camelCase로 정확히 내려준다.
```

따라서 F/E에서는 아래 처리를 하지 않는다.

```txt
normalizeSpecRow 사용 안 함
Array.isArray 사용 안 함
response.rows || response.content || response 같은 fallback 사용 안 함
row.specNm || row.specName 같은 필드명 fallback 사용 안 함
```

F/E는 Java 응답을 그대로 Redux에 저장한다.

```txt
response.rows    → masterRows
response.details → detailRows
```

---

## 2. 전체 흐름 한눈에 보기

```txt
[화면]
상단 조회조건 3개 선택
  - FAB
  - MODEL
  - 모델관리기준명

  ↓

[Redux]
search state에 저장
  - search.fabId
  - search.setModelNm
  - search.specNm

  ↓

[조회 버튼]
SEARCH_REQUEST dispatch

  ↓

[Saga]
Redux search state 조회
vcSpecApi.selectCondition 호출

  ↓

[API Adapter]
POST /api/vc/specmaster/selectcondition 호출
body 생성

  ↓

[Controller.java]
@RequestBody 수신
fabId, setModelNm, specNm으로 Master 조회
selectedSpecId 기준으로 선택 Master 유지
선택 Master의 Detail 조회

  ↓

[Saga]
Java JSON 그대로 Redux 저장

  ↓

[화면]
Master Grid / Detail Grid 표시
```

---

## 3. 최종 Request Body

```json
{
  "tabId": "SPEC_MASTER",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "specNm": "Litho",
  "selectedSpecId": "SPEC-M14-LITHO-A"
}
```

| Field | 구분 | 설명 |
| --- | --- | --- |
| `tabId` | 고정값 | 화면 구분. `SPEC_MASTER` |
| `fabId` | 조회조건 | 화면 상단 FAB |
| `setModelNm` | 조회조건 | 화면 상단 MODEL |
| `specNm` | 조회조건 | 화면 상단 모델관리기준명 |
| `selectedSpecId` | 선택 유지값 | 조회 후 기존 Master 선택을 유지하기 위한 값 |

`selectedSpecId`는 조회조건이 아니다.  
조회 후 기존 선택 Master가 결과에 남아 있으면 유지하고, 없으면 B/E가 첫 번째 Master를 선택해서 내려준다.

---

## 4. 최종 Response Body

```json
{
  "rows": [
    {
      "specId": "SPEC-M14-LITHO-A",
      "specNm": "M14 Litho Track",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "operLargeCatgVal": "",
      "operMidCatgVal": "",
      "chambModelNm": "",
      "modelSpecUseYn": "0",
      "srcGbnCd": "U",
      "detSearYn": "Y",
      "upperCd": "",
      "mgmtTgtYn": "Y",
      "specMinVal": null,
      "specMaxVal": null,
      "chgrEmpno": "100310",
      "chgrNm": "S. Choi",
      "specDesc": "Master Spec"
    }
  ],
  "details": [
    {
      "specId": "SPEC-M14-LITHO-A-CH01",
      "specNm": "M14 Litho Develop Chamber",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "operLargeCatgVal": "LITHO",
      "operMidCatgVal": "Developer",
      "chambModelNm": "LITHO-DEV-03",
      "modelSpecUseYn": "0",
      "srcGbnCd": "U",
      "detSearYn": "N",
      "upperCd": "SPEC-M14-LITHO-A",
      "mgmtTgtYn": "Y",
      "specMinVal": 41,
      "specMaxVal": 89,
      "chgrEmpno": "100312",
      "chgrNm": "Y. Han",
      "specDesc": "Detail Spec"
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

Java는 항상 `rows`, `details`를 배열로 내려준다.  
데이터가 없으면 `null`이 아니라 빈 배열 `[]`을 내려준다.

```json
{
  "rows": [],
  "details": [],
  "page": 0,
  "size": 10,
  "totalPages": 1,
  "totalElements": 0,
  "selectedSpecId": "",
  "selectedDetailSpecId": ""
}
```

---

## 5. 파일별 역할

| 구간 | 파일 | 역할 |
| --- | --- | --- |
| 화면 | `src/components/vc/admin/specMaster/SpecMgmt.js` | 조회조건 변경, 조회 버튼 클릭 |
| Action | `src/store/vc/vcMgmt/action.js` | 조회 요청/성공/실패 action 정의 |
| Reducer | `src/store/vc/vcMgmt/reducer.js` | 조회조건과 조회결과를 Redux state에 저장 |
| Selector | `src/store/vc/vcMgmt/vcSpecMgmtSelector.js` | Saga가 Redux state를 읽을 때 사용 |
| Saga | `src/saga/vc/admin/vcSpecSaga.js` | 조회 요청을 받아 API 호출 후 결과 저장 |
| API | `src/service/api/vc/admin/vcSpecApi.js` | `/selectcondition` HTTP 호출 |
| Controller | `vcBePrj/src/main/java/com/example/vcbeprj/controller/VcSpecMasterController.java` | 조회조건 수신, Service 호출, 결과 반환 |
| Service | `vcBePrj/src/main/java/com/example/vcbeprj/service/VcSpecMasterService.java` | Master/Detail 실제 조회 |

---

## 6. 화면 코드

파일: `src/components/vc/admin/specMaster/SpecMgmt.js`

### 6.1 조회조건 3개

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

조회조건 mapping은 아래와 같다.

```txt
FAB             → search.fabId
MODEL           → search.setModelNm
모델관리기준명   → search.specNm
```

### 6.2 조회 버튼

```jsx
<button type="button" className="search-button btn_small" onClick={onSearch}>
  {loading.search ? "조회 중..." : "조회"}
</button>
```

### 6.3 조회 dispatch

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

화면은 조회 payload를 직접 만들지 않는다.  
화면은 search state만 변경하고, 조회 버튼에서는 `SEARCH_REQUEST`만 dispatch한다.

---

## 7. Redux Action 코드

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

`searchRequest`는 조회조건 3개를 받지 않는다.  
조회조건 3개는 이미 Redux `search` state에 들어가 있기 때문이다.

---

## 8. Redux Reducer 코드

파일: `src/store/vc/vcMgmt/reducer.js`

### 8.1 search 기본값

```js
const DEFAULT_SEARCH = {
  fabId: "",
  setModelNm: "",
  specNm: "",
};
```

### 8.2 조회조건 변경

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

FAB이 바뀌면 MODEL을 초기화한다.  
다른 FAB의 MODEL 조건이 남아 잘못 조회되는 것을 막기 위함이다.

### 8.3 조회 요청

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

### 8.4 조회 성공

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

## 9. Selector 코드

파일: `src/store/vc/vcMgmt/vcSpecMgmtSelector.js`

```js
export const selectSpecMgmtState = (state) => state?.vc?.specMaster || initialSpecMasterState;

export const selectSpecMgmtSearch = (state) => selectSpecMgmtState(state).search;
```

Saga는 `selectSpecMgmtSearch`를 통해 조회조건 3개를 읽는다.

---

## 10. Saga 코드

파일: `src/saga/vc/admin/vcSpecSaga.js`

### 10.1 조회 flow

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

    yield put(specMasterActions.searchSuccess({
      rows: response.rows,
      details: response.details,
      page: {
        page: response.page,
        size: response.size,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      },
      selectedSpecId: response.selectedSpecId,
      selectedDetailSpecId: response.selectedDetailSpecId,
    }));
  } catch (error) {
    yield put(specMasterActions.searchFailure(getErrorMessage(error)));
  }
}
```

### 10.2 Master 선택 시 Detail 조회

```js
function* selectMasterFlow(action) {
  if (action.payload.specId) {
    try {
      const state = yield select(selectSpecMgmtState);
      const details = yield call(vcSpecApi.getChildren, action.payload.specId);

      yield put(specMasterActions.searchSuccess({
        rows: state.masterRows,
        details,
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

### 10.3 watcher

```js
export function* watchSpecSaga() {
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.INIT_REQUEST, initSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST, loadSpecConditionFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.CHANGE_PAGE, loadSpecConditionFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SELECT_MASTER, selectMasterFlow);
}
```

---

## 11. API Adapter 코드

파일: `src/service/api/vc/admin/vcSpecApi.js`

```js
export const VC_SPEC_ENDPOINTS = {
  selectCondition: "/api/vc/specmaster/selectcondition",
  selectFilterOptions: "/api/vc/specmaster/selectfilteroptions",
  specById: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}`,
  children: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}/children`,
};
```

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

최종적으로 B/E에 전달되는 조회조건은 아래 3개다.

```txt
search.fabId      → fabId
search.setModelNm → setModelNm
search.specNm     → specNm
```

---

## 12. Controller 코드

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

Controller에서 실제 조회조건으로 쓰는 값은 아래 3개다.

```java
text(body, "fabId")
text(body, "setModelNm")
text(body, "specNm")
```

`selectedSpecId`는 조회조건이 아니다. 선택 유지용이다.

---

## 13. Controller 응답 생성 코드

```java
private Map<String, Object> allRows(List<SpecMaster> rows, int page, int size) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("rows", rows);
    result.put("page", Math.max(page, 0));
    result.put("size", Math.max(size, rows.size()));
    result.put("totalPages", 1);
    result.put("totalElements", rows.size());
    return result;
}
```

`content`는 제거하고 `rows`만 내려준다.  
F/E가 `response.rows`만 사용하기 때문이다.

---

## 14. Service 조회 기준

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
| `isBlank(row.upperCd())` | Master만 조회 |
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

## 15. 제거 대상

### 15.1 Saga에서 제거

```txt
normalizeSpecRow 함수 전체 제거
```

```txt
toArray 함수가 selectcondition 조회에만 쓰이고 있다면 제거
```

```txt
Array.isArray(response.rows) 사용 제거
Array.isArray(response.details) 사용 제거
```

```txt
response.rows || response.content || response 사용 제거
```

### 15.2 API request에서 제거

```txt
selectedDetailSpecId request 전달 제거
```

### 15.3 Controller response에서 제거

```txt
content 제거
rows만 사용
```

---

## 16. 최종 정리

```txt
조회조건
  FAB             → fabId
  MODEL           → setModelNm
  모델관리기준명   → specNm

선택 유지
  selectedSpecId  → Master 선택 유지용

제거
  normalizeSpecRow
  Array.isArray
  toArray 기반 response fallback
  selectedDetailSpecId request 전달
  content response field

전제
  Java가 rows/details를 항상 배열로 내려준다.
  Java가 SpecMaster camelCase 필드명을 정확히 내려준다.
```

최종 방향은 아래 한 문장이다.

```txt
Java가 정확한 JSON 계약을 지키고, F/E는 그 JSON을 그대로 Redux에 저장한다.
```