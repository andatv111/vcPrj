# SpecMaster 화면 코드 이해 문서

> 대상 화면: `V/C Administration > Spec Master`  
> 기준 화면 파일: `src/components/vc/admin/SpecMaster.js`  
> 기준 API 문서: `md/SPEC_MASTER_API.md`  
> 목적: 초급 개발자가 SpecMaster 화면의 Master/Detail 구조, Redux 흐름, API 호출 경계를 코드 기준으로 이해할 수 있게 정리합니다.

---

## 1. 이 화면이 하는 일

SpecMaster 화면은 V/C 계산에 사용할 Spec 기준을 관리합니다.

화면은 좌우 두 grid로 나뉩니다.

| 영역 | 역할 |
| --- | --- |
| Search Conditions | FAB, MODEL, 모델관리기준 조건을 선택합니다. |
| Master Grid | `upperCd`가 비어 있는 상위 Spec row를 보여줍니다. |
| Detail Grid | 선택한 Master의 하위 Spec row를 보여줍니다. |
| SpecMasterPopup | Master 또는 Detail을 신규 등록하거나 수정합니다. |

전체 흐름은 아래처럼 보면 됩니다.

```txt
화면 진입
-> FAB 공통코드와 SpecMaster 필터 옵션 조회
-> Master Grid 조회
-> 초기 선택 Master의 Detail Grid 표시
-> Master radio 선택
-> 선택 Master의 Detail만 조회
-> Master/Detail 신규, 수정, 삭제
-> 저장/삭제 후 Master 조회와 Detail 최신화
-> 필요하면 Master 1건 + Detail 목록을 Excel로 다운로드
```

여기서 중요한 변경점은 Master radio 선택 흐름입니다.

예전처럼 radio 선택 때마다 `/api/vc/specmaster/search`로 Master 목록까지 다시 조회하지 않습니다. 이미 화면에 Master 목록이 있으므로, radio 선택 시에는 아래 API로 Detail만 조회합니다.

```txt
GET /api/vc/specmaster/{specId}/children
```

---

## 2. 꼭 기억해야 할 업무 key

| 개념 | 코드 필드 | 설명 |
| --- | --- | --- |
| Spec row PK | `specId` | Master와 Detail row 모두의 고유 key입니다. |
| Master/Detail 구분 | `upperCd` | 비어 있으면 Master, 값이 있으면 Detail입니다. |
| 부모 Master | `upperCd` | Detail row에서는 부모 Master의 `specId`입니다. |
| 선택 Master | `selectedSpecId` | 좌측 Master Grid radio 선택값입니다. |
| 선택 Detail | `selectedDetailSpecId` | 우측 Detail Grid radio 선택값입니다. |
| FAB | `fabId` | Spec 적용 FAB입니다. |
| MODEL | `setModelNm` | 장비 model입니다. |
| 모델관리기준 | `specNm` | Master/Detail의 기준명입니다. |
| CHAMBER SPEC | `chambModelNm` | Detail row에서 사용하는 chamber spec입니다. |
| 상세스펙 유무 | `detSearYn` | Master에서 상세 row를 별도 관리할지 나타내는 값입니다. |
| 사용여부 | `mgmtTgtYn` | Spec 사용 여부입니다. |

정리하면 `specId`는 row 자체의 key이고, `upperCd`는 Detail이 어느 Master 아래에 있는지 알려주는 연결 key입니다.

---

## 3. 파일 역할 한눈에 보기

### 화면 파일

| 파일 | 역할 |
| --- | --- |
| `src/components/vc/admin/SpecMaster.js` | SpecMaster 화면 container와 grid, popup UI를 모두 담고 있습니다. |
| `GridHeaderFilter` | grid header 필터 팝오버를 그립니다. `Esc`와 포커스 이탈 시 닫힙니다. |
| `MasterGridPanel` | 좌측 Master Grid를 그립니다. |
| `DetailGridPanel` | 우측 Detail Grid와 Excel 버튼을 그립니다. |
| `SpecMasterPopup` | Master/Detail 신규, 수정 팝업입니다. |
| `SelectField`, `InputField`, `SwitchField` | 팝업과 검색조건에서 쓰는 작은 입력 컴포넌트입니다. |

### 상태 관리 파일

| 파일 | 역할 |
| --- | --- |
| `src/store/vc/specMaster/action.js` | SpecMaster action type과 action creator를 정의합니다. |
| `src/store/vc/specMaster/reducer.js` | search, grid row, 선택값, popup, loading state를 변경합니다. |
| `src/store/vc/specMaster/vcSpecMasterSelector.js` | 화면이 필요한 SpecMaster state를 읽는 selector 모음입니다. |
| `src/saga/vc/admin/specMasterSaga.js` | action을 받아 API 호출, 응답 정리, success/failure action dispatch를 담당합니다. |
| `src/service/api/vc/admin/specMasterApi.js` | 실제 HTTP 요청을 보내는 API adapter입니다. |

### B/E 파일

| 파일 | 역할 |
| --- | --- |
| `VcSpecMasterController.java` | `/api/vc/specmaster/...` endpoint를 제공합니다. |
| `VcSpecMasterService.java` | TXT mock table 기준 조회, 생성, 수정, 삭제 업무를 처리합니다. |
| `VCW_VC_SPEC_MST.txt` | preview용 SpecMaster mock table입니다. |

---

## 4. Master와 Detail 구조

SpecMaster는 Master table과 Detail table이 따로 있는 구조가 아닙니다. 같은 row 구조를 쓰고 `upperCd`로 구분합니다.

```txt
Master row
specId = SPEC-M14-LITHO-A
upperCd = ""

Detail row
specId = SPEC-M14-LITHO-A-CH03
upperCd = SPEC-M14-LITHO-A
```

화면에서는 이렇게 표시합니다.

| 조건 | 표시 위치 |
| --- | --- |
| `upperCd`가 비어 있음 | 좌측 Master Grid |
| `upperCd === selectedSpecId` | 우측 Detail Grid |

이 규칙 때문에 Master Grid 조회 후 F/E는 `upperCd`가 있는 row를 Master 목록에서 제외합니다.

```js
const rows = toArray(response).map(normalizeSpecRow).filter((row) => !row.upperCd);
```

---

## 5. 화면 진입 시 실제 흐름

`SpecMaster.js`는 mount될 때 두 action을 보냅니다.

```js
dispatch(specMasterActions.initRequest());
dispatch(specMasterActions.searchRequest());
```

각 action은 역할이 다릅니다.

| action | 목적 |
| --- | --- |
| `INIT_REQUEST` | FAB, MODEL, 공정, CHAMBER SPEC 같은 콤보 후보를 준비합니다. |
| `SEARCH_REQUEST` | 좌측 Master Grid와 초기 Detail Grid를 조회합니다. |

흐름을 파일 기준으로 보면 아래와 같습니다.

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `SpecMaster.js` | 화면 진입 시 `initRequest`, `searchRequest`를 dispatch합니다. |
| 2 | `specMasterSaga.js` | `initSpecMasterFlow`와 `searchSpecMasterFlow`가 실행됩니다. |
| 3 | `specMasterApi.js` | 공통코드, 필터 옵션, Master 조회 API를 호출합니다. |
| 4 | `specMasterSaga.js` | B/E 응답을 option과 grid row 모양으로 정리합니다. |
| 5 | `reducer.js` | options, masterRows, detailRows, selectedSpecId를 state에 저장합니다. |
| 6 | `vcSpecMasterSelector.js` | 화면이 필요한 state를 selector로 읽습니다. |
| 7 | `SpecMaster.js` | Search Conditions, Master Grid, Detail Grid를 다시 그립니다. |

---

## 6. Search 버튼 흐름

Search Conditions에서 조건을 바꾸면 state만 바뀝니다.

```js
dispatch(specMasterActions.setSearchField({ name, value }));
```

실제 조회는 `조회` 버튼을 눌렀을 때 실행됩니다.

```js
dispatch(specMasterActions.searchRequest());
```

조회 버튼 이후 흐름은 아래와 같습니다.

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `SearchPanel` | 조회 버튼 클릭을 상위로 전달합니다. |
| 2 | `SpecMaster.js` | `SEARCH_REQUEST` action을 dispatch합니다. |
| 3 | `reducer.js` | `loading.search = true`로 바꾸고 message/error를 비웁니다. |
| 4 | `specMasterSaga.js` | 현재 search 조건과 page 값을 selector로 읽습니다. |
| 5 | `specMasterApi.js` | `POST /api/vc/specmaster/search`를 호출합니다. |
| 6 | `specMasterSaga.js` | 응답 rows와 details를 normalize합니다. |
| 7 | `reducer.js` | Master row, Detail row, 선택값, page를 저장합니다. |
| 8 | `SpecMaster.js` | grid를 다시 표시합니다. |

현재 F/E는 grid header 필터와 page 이동을 화면 내부에서 처리하기 위해 B/E 요청 size를 크게 잡습니다.

```js
const requestPage = { ...page, page: 0, size: 500 };
```

---

## 7. Master radio 선택 흐름

좌측 Master Grid에서 radio를 클릭하면 아래 action이 실행됩니다.

```js
dispatch(specMasterActions.selectMaster(specId));
```

이때 중요한 점은 Master 목록을 다시 조회하지 않는다는 점입니다. 흐름은 아래와 같습니다.

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `MasterGridPanel` | 선택한 Master의 `specId`를 상위로 전달합니다. |
| 2 | `SpecMaster.js` | `SELECT_MASTER` action을 dispatch합니다. |
| 3 | `reducer.js` | `selectedSpecId`를 바꾸고 기존 `detailRows`를 비웁니다. |
| 4 | `specMasterSaga.js` | `selectMasterFlow`가 `DETAIL_REQUEST`를 dispatch합니다. |
| 5 | `specMasterSaga.js` | `detailSpecMasterFlow`가 실행됩니다. |
| 6 | `specMasterApi.js` | `GET /api/vc/specmaster/{specId}/children`을 호출합니다. |
| 7 | `reducer.js` | 응답받은 Detail rows를 저장하고 첫 Detail을 선택합니다. |
| 8 | `DetailGridPanel` | 새 Detail Grid를 표시합니다. |

이렇게 나눈 이유는 불필요한 Master 재조회가 B/E 부하와 화면 깜빡임을 만들 수 있기 때문입니다.

---

## 8. Detail radio 선택 흐름

우측 Detail Grid radio 선택은 API를 호출하지 않습니다.

```js
dispatch(specMasterActions.selectDetail(specId));
```

`reducer.js`는 `selectedDetailSpecId`만 바꿉니다.

```txt
Detail radio 클릭
-> SELECT_DETAIL
-> selectedDetailSpecId 변경
-> 수정/삭제 버튼의 대상 row가 바뀜
```

Detail row의 실제 객체는 selector가 찾습니다.

```js
export const selectSpecMasterSelectedDetail = (state) => {
  const specMaster = selectSpecMasterState(state);
  return specMaster.detailRows.find((row) => row.specId === specMaster.selectedDetailSpecId) || null;
};
```

---

## 9. grid header 필터와 page 처리

Master/Detail grid의 header filter는 B/E 검색이 아니라 F/E 내부 필터입니다.

```js
const filteredMasterRows = useMemo(
  () => filterRows(masterRows, masterFilters, FILTERABLE_MASTER_COLUMNS),
  [masterRows, masterFilters]
);
```

흐름은 아래처럼 움직입니다.

| 단계 | 설명 |
| --- | --- |
| 1 | 필터 아이콘을 클릭하면 `GridHeaderFilter` 팝오버가 열립니다. |
| 2 | input에 값을 입력하면 `masterFilters` 또는 `detailFilters`가 바뀝니다. |
| 3 | `filterRows`가 화면 row를 다시 계산합니다. |
| 4 | `paginateRows`가 현재 page에 보일 row만 잘라냅니다. |
| 5 | 필터가 바뀌면 page는 0으로 돌아갑니다. |

팝오버는 두 상황에서 닫힙니다.

| 상황 | 처리 |
| --- | --- |
| `Esc` key | input `onKeyDown`에서 `setOpen(false)` |
| 포커스 이탈 | wrapper `onBlur`에서 바깥으로 나갔는지 확인 후 닫음 |

---

## 10. Master 신규 등록 흐름

좌측 Master Grid의 `신규` 버튼을 누르면 아래 action이 실행됩니다.

```js
dispatch(specMasterActions.openCreatePopup("master"));
```

흐름은 아래와 같습니다.

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `MasterGridPanel` | 신규 버튼 클릭을 상위로 전달합니다. |
| 2 | `SpecMaster.js` | `OPEN_CREATE_POPUP` action을 dispatch합니다. |
| 3 | `reducer.js` | popup을 열고 `scope = "master"`로 설정합니다. |
| 4 | `SpecMasterPopup` | Master용 입력 항목만 보여줍니다. |
| 5 | 저장 버튼 | `SAVE_REQUEST` action을 dispatch합니다. |
| 6 | `specMasterSaga.js` | validation 후 `POST /api/vc/specmaster`를 호출합니다. |
| 7 | `specMasterSaga.js` | 저장 성공 후 `/search`를 다시 호출합니다. |

Master 팝업에서는 Detail 성격의 필드를 숨깁니다.

| 숨기는 항목 | 이유 |
| --- | --- |
| 공정대분류 | Detail row에서 관리하는 값입니다. |
| 공정중분류 | Detail row에서 관리하는 값입니다. |
| CHAMBER SPEC | Detail row에서 관리하는 값입니다. |

---

## 11. Detail 신규 등록 흐름

우측 Detail Grid의 `신규` 버튼은 선택된 Master 아래에 Detail row를 만듭니다.

```js
dispatch(specMasterActions.openCreatePopup("detail"));
```

Detail 신규에서 가장 중요한 것은 부모 Master 정보입니다. reducer는 현재 선택 Master를 찾아 form 기본값으로 깔아줍니다.

```js
form: normalizePopupForm({}, action.payload.scope, findSelectedMaster(state))
```

Detail 팝업에서 FAB/MODEL이 잠기는 이유도 여기에 있습니다.

| 항목 | 동작 |
| --- | --- |
| FAB | 선택 Master에서 물려받고 수정하지 못하게 합니다. |
| MODEL | 선택 Master에서 물려받고 수정하지 못하게 합니다. |
| `upperCd` | 선택 Master의 `specId`로 세팅됩니다. |
| 공정대분류, 공정중분류, CHAMBER SPEC | Detail에서 새로 입력합니다. |

저장 시 saga는 아래 API를 호출합니다.

```txt
POST /api/vc/specmaster/{parentSpecId}/children
```

저장 후에는 `/search`를 다시 호출합니다. 이때 부모 Master와 저장된 Detail을 선택값으로 넘겨서 팝업이 닫힌 뒤에도 선택 상태가 유지되게 합니다.

---

## 12. 수정 흐름

수정 버튼은 선택된 row를 popup form으로 복사합니다.

Master 수정:

```js
dispatch(specMasterActions.openEditPopup({ scope: "master", row: selectedMaster }));
```

Detail 수정:

```js
dispatch(specMasterActions.openEditPopup({ scope: "detail", row: selectedDetail }));
```

저장 시 API는 Master와 Detail 모두 같습니다.

```txt
PATCH /api/vc/specmaster/{specId}
```

둘을 같은 API로 처리할 수 있는 이유는 Master와 Detail이 같은 row 구조를 쓰기 때문입니다.

---

## 13. 삭제 흐름

삭제 버튼은 browser confirm을 먼저 띄웁니다.

Master 삭제 문구에는 하위 Detail도 함께 삭제될 수 있다는 안내가 들어갑니다.

```txt
선택한 Master "..."를 삭제하시겠습니까?
하위 Detail 데이터도 함께 삭제될 수 있습니다.
```

삭제 API는 공통입니다.

```txt
DELETE /api/vc/specmaster/{specId}
```

B/E preview 정책은 아래와 같습니다.

| 삭제 대상 | 결과 |
| --- | --- |
| Master | 자신과 하위 Detail을 함께 삭제 |
| Detail | 해당 Detail row만 삭제 |

삭제 후 saga는 `/search`를 다시 호출해서 grid를 최신화합니다.

---

## 14. Excel 다운로드

Detail Grid 영역의 Excel 버튼은 선택 Master 1건과 현재 Detail Grid 목록을 함께 내려받습니다.

중요한 점은 Master와 Detail을 한 table로 합치지 않는다는 것입니다.

| 구분 | 이유 |
| --- | --- |
| Master table | FAB, MODEL, SPEC NAME, V/C Min/Max 중심 |
| Detail table | 공정대분류, 공정중분류, CHAMBER SPEC까지 포함 |

그래서 `downloadExcel`은 HTML 안에 table 두 개를 만들고 `.xls`로 다운로드합니다.

```txt
MASTER table
blank line
DETAIL table
```

이 방식은 Excel에서 열 수 있고, Master/Detail 컬럼 차이도 보존합니다.

---

## 15. selector를 왜 쓰는가

SpecMaster 화면도 Non-BIM과 마찬가지로 화면이 Redux 내부 구조를 직접 알지 않게 selector를 사용합니다.

예를 들어 화면은 아래처럼 state를 읽습니다.

```js
const masterRows = useSelector(selectSpecMasterMasterRows);
const selectedMaster = useSelector(selectSpecMasterSelectedMaster);
```

selector의 장점은 아래와 같습니다.

| 장점 | 설명 |
| --- | --- |
| store 경로 숨김 | 화면은 `state.vc.specMaster` 경로를 직접 몰라도 됩니다. |
| fallback 제공 | reducer가 아직 연결되지 않은 테스트 환경에서도 초기 state를 반환합니다. |
| 선택 row 계산 집중 | `selectedSpecId`로 실제 Master row를 찾는 로직을 selector에 모읍니다. |
| 화면 코드 단순화 | 화면은 필요한 값을 이름으로 읽습니다. |

---

## 16. selector별 의미

파일 위치:

```txt
src/store/vc/specMaster/vcSpecMasterSelector.js
```

| selector | 반환값 | 쓰는 곳 |
| --- | --- | --- |
| `selectSpecMasterSearch` | Search Conditions 값 | `SearchPanel` |
| `selectSpecMasterOptions` | FAB/MODEL/공정 option | 검색조건, popup |
| `selectSpecMasterMasterRows` | 좌측 Master Grid row | `MasterGridPanel` |
| `selectSpecMasterDetailRows` | 우측 Detail Grid row | `DetailGridPanel` |
| `selectSpecMasterSelectedSpecId` | 선택 Master `specId` | radio checked, 버튼 disabled |
| `selectSpecMasterSelectedDetailSpecId` | 선택 Detail `specId` | Detail radio checked |
| `selectSpecMasterSelectedMaster` | 선택 Master row 객체 | 수정, 삭제, Detail 신규 기본값 |
| `selectSpecMasterSelectedDetail` | 선택 Detail row 객체 | Detail 수정, 삭제 |
| `selectSpecMasterPage` | B/E paging 정보 | 조회 request와 page state |
| `selectSpecMasterPopup` | popup visible/mode/scope/form | `SpecMasterPopup` |
| `selectSpecMasterLoading` | 영역별 loading | 버튼 disabled, 조회중 문구 |
| `selectSpecMasterError` | 오류 메시지 | error box |
| `selectSpecMasterMessage` | 성공 메시지 | notice box |

---

## 17. reducer state 구조

`initialSpecMasterState`는 크게 여섯 영역입니다.

| 영역 | 역할 |
| --- | --- |
| `search` | Search Conditions 값 |
| `options` | 콤보 후보 |
| `masterRows` | 좌측 grid 원천 데이터 |
| `detailRows` | 우측 grid 원천 데이터 |
| `selectedSpecId`, `selectedDetailSpecId` | radio 선택값 |
| `page` | Master 조회 paging 정보 |
| `popup` | 등록/수정 팝업 상태 |
| `loading` | init/search/details/save/delete 상태 |
| `error`, `message` | 화면 알림 |

loading을 하나로 두지 않고 나눈 이유는 버튼별 상태가 다르기 때문입니다.

| loading key | 주 사용처 |
| --- | --- |
| `init` | 콤보 초기화 |
| `search` | Search 버튼과 Master Grid empty 문구 |
| `details` | Detail Grid empty 문구 |
| `save` | 팝업 저장 버튼 |
| `delete` | 삭제 버튼 |

---

## 18. popup form 보정 규칙

`normalizePopupForm`은 popup을 열 때 form 기본값을 만듭니다.

Master popup과 Detail popup은 같은 `EMPTY_POPUP_FORM`을 공유하지만 실제 의미가 다릅니다.

| 상황 | form 보정 |
| --- | --- |
| Master 신규 | 빈 form에서 시작합니다. |
| Master 수정 | 선택 Master row 값을 form에 복사합니다. |
| Detail 신규 | 선택 Master 값을 parent로 깔고 `upperCd`에 parent `specId`를 넣습니다. |
| Detail 수정 | 선택 Detail row 값을 form에 복사하고 parent 정보도 보정합니다. |

`SET_POPUP_FIELD`에는 업무 규칙도 들어 있습니다.

| 변경 field | 값 | reducer 처리 |
| --- | --- | --- |
| `detSearYn` | `Y` | Master 자체의 `specNm`, `specMinVal`, `specMaxVal`을 비웁니다. |
| `manualRegYn` | `Y` | AREA, MAKER 값을 비웁니다. |

이 처리는 화면에서 숨기거나 disabled 하는 것만으로는 부족합니다. 저장 payload에 잘못된 값이 남지 않게 reducer에서도 정리합니다.

---

## 19. saga가 하는 일

`specMasterSaga.js`는 API 호출과 응답 정리를 담당합니다.

| saga flow | Trigger action | API |
| --- | --- | --- |
| `initSpecMasterFlow` | `INIT_REQUEST` | FAB 공통코드, 필터 옵션 |
| `searchSpecMasterFlow` | `SEARCH_REQUEST` | `POST /api/vc/specmaster/search` |
| `detailSpecMasterFlow` | `DETAIL_REQUEST` | `GET /api/vc/specmaster/{specId}/children` |
| `saveSpecMasterFlow` | `SAVE_REQUEST` | create/update API |
| `deleteSpecMasterFlow` | `DELETE_REQUEST` | delete API |
| `changePageFlow` | `CHANGE_PAGE` | 다시 search |
| `selectMasterFlow` | `SELECT_MASTER` | Detail request로 연결 |

saga 안에서 하는 보정도 중요합니다.

| 함수 | 역할 |
| --- | --- |
| `toArray` | B/E 응답이 array, rows, content, data 등으로 와도 array로 맞춥니다. |
| `normalizeOption` | 문자열 또는 object option을 `{ value, label }`로 맞춥니다. |
| `normalizeSpecRow` | B/E row를 화면 grid row로 맞춥니다. |
| `sanitizeSpecPayload` | popup form을 저장 API request body로 정리합니다. |
| `validatePopup` | 저장 전 필수값을 검사합니다. |

---

## 20. API adapter가 하는 일

파일 위치:

```txt
src/service/api/vc/admin/specMasterApi.js
```

화면과 saga는 endpoint 문자열을 직접 만들지 않고 adapter 함수를 호출합니다.

| 함수 | Method/URL | 역할 |
| --- | --- | --- |
| `getFilterOptions` | GET 공통코드 + GET 필터 옵션 | 화면 콤보 후보 준비 |
| `search` | POST `/api/vc/specmaster/search` | Master Grid와 초기 Detail 조회 |
| `getChildren` | GET `/api/vc/specmaster/{specId}/children` | 선택 Master의 Detail만 조회 |
| `createMaster` | POST `/api/vc/specmaster` | Master 신규 |
| `updateSpec` | PATCH `/api/vc/specmaster/{specId}` | Master/Detail 수정 |
| `createChild` | POST `/api/vc/specmaster/{specId}/children` | Detail 신규 |
| `deleteSpec` | DELETE `/api/vc/specmaster/{specId}` | Master/Detail 삭제 |

`getFilterOptions`는 조금 특이합니다. FAB는 공통코드 API를 우선 사용하고, 필터 옵션 API가 실패하면 legacy `/api/vc/specs`를 fallback으로 호출할 수 있습니다.

```txt
공통코드 API
+ 필터 옵션 API
-> 옵션 merge
-> saga에서 화면 option으로 normalize
```

---

## 21. B/E endpoint와 service 기준

SpecMaster B/E controller는 아래 endpoint를 제공합니다.

| Method | URL | Controller method | Service method |
| --- | --- | --- | --- |
| POST | `/api/vc/specmaster/search` | `search` | `searchMasters`, `getChildren` |
| GET | `/api/vc/specmaster/selectfilteroptions` | `selectFilterOptions` | `filterOptions` |
| GET | `/api/vc/specmaster/{specId}/children` | `children` | `getChildren` |
| POST | `/api/vc/specmaster` | `createMaster` | `createMaster` |
| POST | `/api/vc/specmaster/{specId}/children` | `createChild` | `createChild` |
| PATCH | `/api/vc/specmaster/{specId}` | `update` | `update` |
| DELETE | `/api/vc/specmaster/{specId}` | `delete` | `delete` |
| POST | `/api/vc/specmaster/selectexact` | `selectExact` | `searchAll` |

`selectexact`는 현재 F/E에서 호출하지 않는 보류 API입니다. 저장 전 중복 확인 요구가 생기면 연결 후보가 될 수 있습니다.

---

## 22. SpecMaster와 V/C 계산의 연결점

SpecMaster 화면은 기준 데이터를 관리하고, Simulation/Calculator는 이 기준을 사용해 판정합니다.

| 영역 | SpecMaster 사용 방식 |
| --- | --- |
| Non-BIM 장비 Spec option | `VCW_VC_SPEC_MST`에서 model standard 후보를 조회합니다. |
| Calculator options | 사용 가능한 Spec을 option으로 내려줍니다. |
| 계산 판정 | FAB, MODEL, CHAMBER SPEC 기준으로 Spec을 찾아 min/max를 비교합니다. |
| SpecMaster Admin | 같은 table의 Master/Detail row를 관리합니다. |

즉 SpecMaster Admin은 “계산 화면에서 쓸 기준 데이터 관리 화면”입니다. 화면 자체가 계산을 하지는 않습니다.

---

## 23. 자주 헷갈리는 질문

### Q1. Master radio 선택 시 왜 `/search`를 다시 호출하지 않나요?

Master 목록은 이미 화면 state에 있습니다. radio 선택은 선택 Master만 바뀌는 동작이므로 Detail만 조회하면 됩니다.

```txt
Master 목록 변경 필요 -> POST /search
선택 Master만 변경 -> GET /{specId}/children
```

### Q2. Detail row를 만들 때 왜 FAB/MODEL을 수정하지 못하게 하나요?

Detail은 선택 Master 아래에 붙는 row입니다. 부모 Master와 다른 FAB/MODEL을 갖게 두면 같은 Master 아래에 서로 다른 기준이 섞입니다. 그래서 Detail 팝업에서는 부모 값을 물려받고 잠급니다.

### Q3. Master와 Detail 수정 API가 왜 같나요?

DB/mock table row 구조가 같습니다. Master인지 Detail인지는 `upperCd`로 구분하므로 수정 endpoint도 `PATCH /api/vc/specmaster/{specId}` 하나로 처리합니다.

### Q4. grid header 필터는 B/E 검색인가요?

아니요. F/E 내부 필터입니다. B/E 검색 조건은 Search Conditions의 FAB, MODEL, 모델관리기준입니다.

### Q5. Excel은 왜 Master와 Detail을 한 표로 합치지 않나요?

컬럼 의미가 다릅니다. Master에는 공정/CHAMBER SPEC이 없고, Detail에는 해당 값이 중요합니다. 그래서 Excel 파일 안에 `MASTER`, `DETAIL` 두 table로 내려받습니다.

### Q6. `/selectexact`는 왜 문서에 있는데 화면에서 안 쓰나요?

현재 저장 UX에는 중복 확인 단계가 없습니다. 그래서 B/E에는 열려 있지만 F/E adapter와 saga에는 호출 함수가 없습니다. 중복 저장 방지 요구가 생기면 연결 후보입니다.

---

## 24. 수정할 때 어디를 봐야 하나

| 하고 싶은 일 | 먼저 볼 파일 |
| --- | --- |
| Search Conditions 추가/변경 | `SpecMaster.js`, `action.js`, `reducer.js`, `specMasterSaga.js`, `SPEC_MASTER_API.md` |
| Master Grid 컬럼 변경 | `SpecMaster.js`의 `MASTER_COLUMNS`, `SPEC_MASTER_API.md` |
| Detail Grid 컬럼 변경 | `SpecMaster.js`의 `DETAIL_COLUMNS`, `SPEC_MASTER_API.md` |
| Master radio 조회 흐름 변경 | `reducer.js`, `specMasterSaga.js`, `specMasterApi.js` |
| Detail 조회 API 변경 | `specMasterApi.js`, `specMasterSaga.js`, `VcSpecMasterController.java` |
| Popup 필드 추가/변경 | `SpecMasterPopup`, `EMPTY_POPUP_FORM`, `normalizePopupForm`, `sanitizeSpecPayload` |
| 저장 validation 변경 | `validatePopup`, `SPEC_MASTER_API.md` |
| 삭제 정책 변경 | `VcSpecMasterService.delete`, `SPEC_MASTER_API.md` |
| Excel 컬럼 변경 | `downloadExcel`, `createExcelTable` |
| 콤보 후보 변경 | `getFilterOptions`, `buildOptionsFromResponse`, `selectfilteroptions` B/E |

---

## 25. 초급 개발자용 읽는 순서

처음부터 모든 파일을 동시에 보면 헷갈립니다. 아래 순서로 보면 흐름이 잡힙니다.

1. `src/components/vc/admin/SpecMaster.js`
   화면이 어떤 selector를 읽고 어떤 action을 dispatch하는지 봅니다.

2. `src/store/vc/specMaster/action.js`
   화면 event 이름과 payload 모양을 확인합니다.

3. `src/store/vc/specMaster/reducer.js`
   action을 받으면 state가 어떻게 바뀌는지 확인합니다.

4. `src/store/vc/specMaster/vcSpecMasterSelector.js`
   화면이 바뀐 state를 어떤 selector로 다시 읽는지 확인합니다.

5. `src/saga/vc/admin/specMasterSaga.js`
   API가 필요한 action이 어떤 endpoint로 이어지는지 확인합니다.

6. `src/service/api/vc/admin/specMasterApi.js`
   실제 HTTP 요청 주소와 method를 확인합니다.

7. `md/SPEC_MASTER_API.md`
   Request/Response field와 화면 계약을 확인합니다.

이 순서로 보면 “버튼 클릭”, “state 변경”, “API 호출”, “grid 재표시”가 한 흐름으로 이어집니다.
