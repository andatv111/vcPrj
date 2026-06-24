# 공통 조회 데이터 처리 작업지시 질문지

기준 저장소: `andatv111/vcPrj`  
기준 브랜치: `codex-work`  
적용 대상: 모든 화면의 조회 API  
목적: 화면 조회 데이터는 Java B/E가 정해진 JSON 계약대로 정확히 내려주고, F/E는 불필요한 가공 없이 그대로 Redux에 저장하도록 작업 지시한다.

---

## 1. 앞으로 모든 화면 조회 개발 시 기본 원칙

앞으로 모든 화면의 조회 데이터 처리는 아래 원칙으로 맞춘다.

```txt
Java B/E가 조회 JSON 구조를 정확히 내려준다.
F/E는 조회 row를 normalize 하지 않는다.
F/E는 필드명 fallback을 하지 않는다.
F/E는 Array.isArray 방어 코딩을 기본으로 넣지 않는다.
F/E는 response.rows, response.details, response.totalCount 같은 계약 필드를 그대로 사용한다.
```

즉, 조회 데이터는 아래처럼 처리한다.

```txt
B/E JSON 계약 확정
  ↓
API adapter에서 request body 생성
  ↓
Saga에서 API 호출
  ↓
Saga에서 response를 그대로 Redux 저장
  ↓
화면 grid/table에서 Redux 데이터를 그대로 표시
```

---

## 2. 나중에 VSCode에서 그대로 사용할 질문

아래 문장을 그대로 사용하면 된다.

```txt
codex-work 브랜치 기준으로 현재 화면의 조회 기능을 공통 조회 방식으로 정리하고 개선해줘.

요구사항:
1. Java B/E가 JSON 구조를 정확히 내려준다는 전제로 작업해줘.
2. F/E saga에서 normalizeRow, normalizeSpecRow 같은 row 가공 함수는 만들지 말아줘.
3. response.rows || response.content || response 같은 fallback 구조는 쓰지 말아줘.
4. Array.isArray 방어 코딩은 쓰지 말아줘.
5. Java에서 내려주는 response.rows 또는 계약된 배열 필드를 그대로 Redux에 저장해줘.
6. 화면 조회조건은 화면 state 또는 Redux search state에 저장하고, 조회 버튼은 SEARCH_REQUEST만 dispatch하게 해줘.
7. 실제 request body는 saga 또는 api adapter에서 Redux search state를 읽어서 만들게 해줘.
8. 조회 후 선택 row 유지가 필요한 화면은 selectedId만 request/response로 주고받게 해줘.
9. selectedDetailId처럼 B/E에서 검증하지 않는 선택값은 request로 보내지 말고, 조회 후 빈 값으로 초기화해줘.
10. 화면, action, reducer, selector, saga, api adapter, Java controller, service 순서로 관련 소스만 발췌해서 보여줘.
11. 마지막에는 이 화면의 조회 흐름을 한눈에 볼 수 있게 표로 정리해줘.
```

---

## 3. 더 짧은 질문 버전

급할 때는 아래처럼 물어보면 된다.

```txt
이 화면 조회를 우리 공통 조회 방식으로 바꿔줘.
Java가 rows 배열을 정확히 내려준다는 전제로 하고,
F/E에서는 normalizeRow, Array.isArray, response fallback 없이
response.rows를 그대로 Redux에 저장하는 구조로 정리해줘.
화면 → Redux → Saga → API → Controller → Service 순서로 관련 소스만 보여줘.
```

---

## 4. 공통 조회 방식 정의

공통 조회 방식은 아래 구조를 의미한다.

```txt
[화면]
조회조건 입력/선택

  ↓

[Redux]
search state에 조회조건 저장

  ↓

[조회 버튼]
SEARCH_REQUEST dispatch

  ↓

[Saga]
Redux search state 조회
API adapter 호출

  ↓

[API Adapter]
POST 또는 GET request 생성

  ↓

[Java Controller]
request body 또는 query parameter 수신
service 호출

  ↓

[Java Service]
DB 조회 또는 mock 조회
계약된 JSON 구조로 response 생성

  ↓

[Saga]
response를 그대로 Redux 저장

  ↓

[화면]
grid/table 표시
```

---

## 5. 화면단 공통 규칙

조회조건은 화면에서 직접 API payload로 만들지 않는다.

화면에서는 아래까지만 한다.

```txt
1. 조회조건 변경 시 Redux search state 변경
2. 조회 버튼 클릭 시 SEARCH_REQUEST dispatch
```

예시:

```jsx
<SearchPanel
  search={search}
  onChange={(name, value) => dispatch(actions.setSearchField(name, value))}
  onReset={() => dispatch(actions.resetSearch())}
  onSearch={() => dispatch(actions.searchRequest())}
/>
```

조회 버튼은 단순해야 한다.

```jsx
<button type="button" onClick={onSearch}>
  조회
</button>
```

하지 말아야 할 것:

```jsx
// 금지: 화면에서 직접 API body를 조립하지 않는다.
onSearch={() => dispatch(actions.searchRequest({
  fabId: search.fabId,
  model: search.model,
  keyword: search.keyword,
}))}
```

---

## 6. Redux Action 공통 규칙

조회 action은 단순하게 유지한다.

```js
searchRequest: ({ selectedId } = {}) => ({
  type: ACTION_TYPES.SEARCH_REQUEST,
  payload: { selectedId },
});
```

조회조건 전체를 action payload에 매번 담지 않는다.

```js
// 지양
searchRequest: (search) => ({
  type: ACTION_TYPES.SEARCH_REQUEST,
  payload: search,
});
```

이유:

```txt
조회조건은 이미 Redux search state에 들어있다.
Saga가 select로 읽으면 된다.
화면은 조회조건 저장과 조회 실행 역할만 분리해서 가진다.
```

---

## 7. Redux Reducer 공통 규칙

search state는 화면 조회조건과 1:1로 맞춘다.

예시:

```js
const DEFAULT_SEARCH = {
  fabId: "",
  modelNm: "",
  keyword: "",
};
```

조회조건 변경:

```js
case ACTION_TYPES.SET_SEARCH_FIELD: {
  const { name, value } = action.payload;

  return {
    ...state,
    search: {
      ...state.search,
      [name]: value,
    },
  };
}
```

조회 성공:

```js
case ACTION_TYPES.SEARCH_SUCCESS:
  return {
    ...state,
    rows: action.payload.rows,
    page: action.payload.page,
    selectedId: action.payload.selectedId,
    loading: {
      ...state.loading,
      search: false,
    },
  };
```

---

## 8. Selector 공통 규칙

Saga는 selector로 search state를 읽는다.

```js
export const selectScreenState = (state) => state?.vc?.screenName || initialState;

export const selectScreenSearch = (state) => selectScreenState(state).search;
```

Saga에서 직접 깊은 경로를 반복해서 쓰지 않는다.

```js
// 지양
const search = yield select((state) => state.vc.screenName.search);
```

---

## 9. Saga 공통 규칙

Saga는 Java 응답을 그대로 Redux에 저장한다.

```js
function* searchFlow(action = {}) {
  try {
    const search = yield select(selectScreenSearch);
    const state = yield select(selectScreenState);

    const requestedId = action.payload?.selectedId ?? state.selectedId;

    const response = yield call(screenApi.search, {
      search,
      selectedId: requestedId,
    });

    yield put(actions.searchSuccess({
      rows: response.rows,
      page: {
        page: response.page,
        size: response.size,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      },
      selectedId: response.selectedId,
    }));
  } catch (error) {
    yield put(actions.searchFailure(getErrorMessage(error)));
  }
}
```

하지 말아야 할 것:

```js
// 금지: Java가 정확히 내려주는 전제에서는 row normalize를 만들지 않는다.
const rows = response.rows.map(normalizeRow);
```

```js
// 금지: 여러 응답 모양을 동시에 허용하지 않는다.
const rows = response.rows || response.content || response.data || [];
```

```js
// 금지: 기본 원칙으로 Array.isArray 방어 코딩을 넣지 않는다.
const rows = Array.isArray(response.rows) ? response.rows : [];
```

---

## 10. API Adapter 공통 규칙

API adapter에서 request body를 만든다.

```js
search({ search, selectedId }) {
  return requestJson(ENDPOINTS.search, {
    method: "POST",
    body: {
      ...search,
      selectedId,
    },
  });
}
```

조회조건 이름은 Java request DTO 또는 Controller에서 받는 이름과 정확히 맞춘다.

예시:

```js
body: {
  fabId: search.fabId,
  modelNm: search.modelNm,
  keyword: search.keyword,
  selectedId,
}
```

하지 말아야 할 것:

```js
// 금지: F/E 임의 이름과 B/E 이름을 섞지 않는다.
body: {
  fabCd: search.fabId,
  model: search.modelNm,
  searchText: search.keyword,
}
```

---

## 11. Java Controller 공통 규칙

Controller는 F/E request를 명확한 이름으로 받는다.

가능하면 `Map<String, Object>`보다 request DTO를 우선한다.

```java
@PostMapping("/search")
public SearchResponse search(@RequestBody SearchRequest request) {
    List<RowDto> rows = service.search(
            request.fabId(),
            request.modelNm(),
            request.keyword()
    );

    String selectedId = service.resolveSelectedId(rows, request.selectedId());

    return new SearchResponse(
            rows,
            0,
            rows.size(),
            1,
            rows.size(),
            selectedId
    );
}
```

DTO 예시:

```java
public record SearchRequest(
        String fabId,
        String modelNm,
        String keyword,
        String selectedId
) {}
```

```java
public record SearchResponse(
        List<RowDto> rows,
        int page,
        int size,
        int totalPages,
        long totalElements,
        String selectedId
) {}
```

Map을 써야 하는 경우에도 response key는 고정한다.

```java
Map<String, Object> result = new LinkedHashMap<>();
result.put("rows", rows);
result.put("page", page);
result.put("size", size);
result.put("totalPages", totalPages);
result.put("totalElements", totalElements);
result.put("selectedId", selectedId);
return result;
```

---

## 12. Java Response 공통 계약

목록 조회 응답은 기본적으로 아래 구조를 따른다.

```json
{
  "rows": [],
  "page": 0,
  "size": 10,
  "totalPages": 1,
  "totalElements": 0,
  "selectedId": ""
}
```

Master/Detail 구조 화면은 아래 구조를 따른다.

```json
{
  "rows": [],
  "details": [],
  "page": 0,
  "size": 10,
  "totalPages": 1,
  "totalElements": 0,
  "selectedId": "",
  "selectedDetailId": ""
}
```

중요:

```txt
rows는 항상 배열이다.
details는 항상 배열이다.
데이터가 없어도 null이 아니라 []이다.
필드명은 Java record/DTO의 camelCase 그대로 내려준다.
```

---

## 13. 선택 row 유지 규칙

선택 row 유지가 필요한 화면만 `selectedId`를 쓴다.

```txt
조회 전 선택 row: selectedId
  ↓
F/E가 selectedId를 request로 전달
  ↓
B/E가 조회 결과 rows 안에 selectedId가 있는지 확인
  ↓
있으면 유지
없으면 첫 번째 row id 반환
없으면 빈 문자열 반환
```

Java 예시:

```java
private String resolveSelectedId(List<RowDto> rows, String requestedId) {
    return rows.stream()
            .filter(row -> Objects.equals(row.id(), requestedId))
            .findFirst()
            .map(RowDto::id)
            .orElse(rows.isEmpty() ? "" : rows.get(0).id());
}
```

F/E saga는 B/E가 확정한 값을 그대로 저장한다.

```js
selectedId: response.selectedId
```

---

## 14. Detail 선택값 규칙

B/E가 Detail 선택값을 검증하지 않는다면 `selectedDetailId`를 request로 보내지 않는다.

조회 후에는 빈 값으로 초기화한다.

```js
selectedDetailId: ""
```

B/E가 Detail 선택 유지까지 책임지는 화면이면 그때만 request/response에 포함한다.

```txt
selectedDetailId를 쓰려면 B/E가 details 안에 해당 id가 있는지 검증해서 반환해야 한다.
검증하지 않는 selectedDetailId는 F/E에서 들고 있지 않는다.
```

---

## 15. 금지 패턴

### 15.1 row normalize 금지

```js
const normalizeRow = (row) => ({
  id: row.id || row.rowId,
  name: row.name || row.title,
});
```

### 15.2 필드명 fallback 금지

```js
const rows = response.rows.map((row) => ({
  specNm: row.specNm || row.specName,
  fabId: row.fabId || row.fabCd,
}));
```

### 15.3 response 모양 fallback 금지

```js
const rows = response.rows || response.content || response.data || [];
```

### 15.4 기본 Array.isArray 방어 금지

```js
const rows = Array.isArray(response.rows) ? response.rows : [];
```

### 15.5 화면에서 API body 직접 조립 금지

```jsx
onSearch={() => dispatch(actions.searchRequest({
  fabId: search.fabId,
  modelNm: search.modelNm,
}))}
```

---

## 16. 허용 패턴

### 16.1 Java response 그대로 저장

```js
yield put(actions.searchSuccess({
  rows: response.rows,
  page: {
    page: response.page,
    size: response.size,
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  },
  selectedId: response.selectedId,
}));
```

### 16.2 API adapter에서 body 생성

```js
search({ search, selectedId }) {
  return requestJson(ENDPOINTS.search, {
    method: "POST",
    body: {
      fabId: search.fabId,
      modelNm: search.modelNm,
      keyword: search.keyword,
      selectedId,
    },
  });
}
```

### 16.3 Controller에서 response 계약 고정

```java
return new SearchResponse(
        rows,
        page,
        size,
        totalPages,
        totalElements,
        selectedId
);
```

---

## 17. 나에게 작업시킬 때 반드시 포함할 문구

아래 문구를 질문에 포함하면 된다.

```txt
조회 데이터는 Java B/E가 정확한 JSON 계약으로 내려준다는 전제로 해줘.
F/E에서는 normalizeRow 만들지 말고, Array.isArray 쓰지 말고,
response.rows || response.content 같은 fallback도 쓰지 말고,
response.rows를 그대로 Redux에 저장하는 구조로 해줘.
```

추가로 Master/Detail 화면이면 아래 문구를 붙인다.

```txt
Master/Detail 화면이면 rows는 Master, details는 Detail로 받고,
selectedId는 Master 선택 유지용으로만 사용해줘.
B/E가 Detail 선택값을 검증하지 않으면 selectedDetailId는 request로 보내지 말고 조회 후 빈 값으로 초기화해줘.
```

---

## 18. 최종 작업 요청 템플릿

아래를 그대로 복사해서 쓰면 된다.

```txt
codex-work 브랜치 기준으로 [화면명] 조회 기능을 공통 조회 방식으로 개선해줘.

공통 조회 방식:
- Java B/E가 정확한 JSON 계약으로 내려준다.
- F/E saga에서 normalizeRow/normalizeSpecRow 같은 row 가공 함수는 사용하지 않는다.
- Array.isArray는 사용하지 않는다.
- response.rows || response.content || response 같은 fallback은 사용하지 않는다.
- API response의 rows/details를 그대로 Redux에 저장한다.
- 화면 조회조건은 Redux search state에 저장한다.
- 조회 버튼은 SEARCH_REQUEST만 dispatch한다.
- API adapter에서 Redux search state를 request body로 만든다.
- 선택 row 유지가 필요한 경우 selectedId만 request/response로 사용한다.
- B/E가 검증하지 않는 selectedDetailId는 request로 보내지 않는다.

확인해줄 범위:
1. 화면 컴포넌트
2. action
3. reducer
4. selector
5. saga
6. api adapter
7. Java controller
8. Java service

출력 방식:
- 관련 소스만 발췌
- 불필요한 전체 파일 출력 금지
- 화면 → Redux → Saga → API → Controller → Service 순서로 설명
- 마지막에 한눈에 보는 흐름표 작성
```

---

## 19. 최종 한 줄 원칙

```txt
조회는 B/E 계약을 믿고, F/E는 가공하지 말고, 그대로 저장한다.
```