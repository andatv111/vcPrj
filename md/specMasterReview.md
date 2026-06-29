# SpecMaster 코드 이해 문서

> 대상 화면: `V/C Administration > Spec Master`  
> 기준 화면 파일: `src/components/vc/admin/spec/SpecMgmt.js`
> 기준 API 문서: `md/SPEC_MASTER_API.md`

## 1. 화면 역할

SpecMaster는 V/C 계산에 쓰는 Spec 기준 데이터를 Master/Detail 구조로 관리하는 화면이다.

| 영역 | 역할 |
| --- | --- |
| Search Conditions | FAB, MODEL, 모델관리기준 조건으로 Master Grid를 조회한다. |
| Master Grid | `upperCd`가 없는 상위 Spec row를 보여준다. |
| Detail Grid | 선택 Master의 하위 Spec row를 보여준다. |
| SpecMgmtPopup | Master 또는 Detail 신규/수정 값을 입력한다. |

## 2. 현재 파일 구조

| 파일 | 역할 |
| --- | --- |
| `src/components/vc/admin/spec/SpecMgmt.js` | 화면 container. selector로 state를 읽고 action을 dispatch한다. |
| `src/components/vc/admin/spec/pop/SpecMgmtPopup.js` | Master/Detail 저장 팝업. scope에 따라 필드 노출을 나눈다. |
| `src/components/vc/admin/spec/ui/SpecMgmtGrid.js` | Master Grid, Detail Grid, header filter, paging UI. |
| `src/components/vc/admin/spec/ui/SpecMgmtFields.js` | 팝업/검색에서 쓰는 select, input, switch field. |
| `src/components/vc/admin/spec/core/SpecMgmt.core.js` | column 정의, filter, paging, Excel helper. |
| `src/store/vc/spec/action.js` | SpecMaster action type과 action creator. |
| `src/store/vc/spec/reducer.js` | 조회, 선택, 팝업, 저장/삭제 loading state. |
| `src/store/vc/spec/specSelector.js` | 화면에서 읽는 selector. |
| `src/saga/vc/admin/specSaga.js` | API 호출 흐름과 response normalize. |
| `src/service/api/vc/admin/specApi.js` | GoodDocs 기준 HTTP API adapter. |

## 3. API 흐름

| 화면 동작 | 호출 API | 갱신하는 state |
| --- | --- | --- |
| 화면 최초 로딩 | `GET /api/vc/code/getFabOptions` | `searchOptions.fabIds` |
| 화면 최초 로딩 | `POST /api/vc/specmaster/selectcondition` | 전체 `masterRows`, `detailRows`, 선택 row |
| FAB 선택 | `GET /api/vc/code/getSpecMModelOptions?fabId=` | `searchOptions.setModelNms` |
| Spec Name 입력 | `GET /api/vc/code/getMSpecNMs?fabId=&specNm=` | `specNameSuggestions` |
| 조회 버튼 | `POST /api/vc/specmaster/selectcondition` | grid 데이터만 갱신, 콤보 유지 |
| Master radio 선택 | API 없음 | 이미 받은 `detailRows`를 F/E에서 필터 |
| 신규/수정 팝업 열기 | `GET /api/vc/specmaster/selectfilteroptions` | 팝업 `options` |
| 수정 팝업 열기 | `GET /api/vc/specmaster/{specId}` | popup form 보정 |
| Master 신규 | `POST /api/vc/specmaster` | 팝업 종료 후 grid 재조회 |
| Master/Detail 수정 | `PATCH /api/vc/specmaster/{specId}` | 팝업 종료 후 grid 재조회 |
| Detail 신규 | `POST /api/vc/specmaster/{specId}/children` | 팝업 종료 후 grid 재조회 |
| 삭제 | `DELETE /api/vc/specmaster/{specId}?chgchgrempno=` | grid 재조회 |

상단 검색 콤보는 `searchOptions`, 팝업 콤보는 `options`로 분리한다. 최초 진입에는 FAB와 grid API만 호출하고 팝업 후보는 팝업을 열 때 조회한다.

## 4. 조회 시 리셋 방지 규칙

`specSaga.js`의 `loadSpecConditionFlow`는 B/E에 선택값을 보내지 않는다. 조회 전 선택 ID를 F/E state에서 기억하고, 새 전체 결과에 해당 ID가 남아 있으면 reducer가 선택을 복원한다.

FAB 변경 시 MODEL/Spec Name 후보를 초기화한다. MODEL 응답의 요청 `fabId`가 현재 검색 `fabId`와 다르면 stale 응답으로 보고 버린다.

콤보 후보는 테스트 가능한 소수 데이터로 제한한다. Master popup은 `FAB -> AREA -> MAKER -> MODEL`, Detail popup은 `공정대분류 -> 공정중분류` 순서로 하위 후보를 좁힌다.

## 5. Master 팝업 규칙

| 필드 | 규칙 |
| --- | --- |
| FAB | 필수, 콤보 |
| AREA | 콤보. 수기등록 Y이면 비활성화 및 필수 제외 |
| MAKER | 필수, 콤보. 수기등록 Y이면 비활성화 및 필수 제외 |
| MODEL | 기본 콤보. 수기등록 Y이면 text 입력 |
| 모델관리기준명 | 한 줄 전체 사용. 상세스펙 유무 Y이면 비활성화 및 필수 제외 |
| MIN/MAX SPEC | 상세스펙 유무 Y이면 비활성화 및 필수 제외 |
| 장비담당자 | 필수 |
| 비고 | 한 줄 입력 |
| 상세스펙 유무 | Y이면 Master 자체의 모델관리기준명, MIN, MAX를 저장하지 않는다. |
| 수기등록 | Y이면 MODEL 직접 입력, AREA/MAKER 제외 |
| 사용여부 | 저장 시 Y/N으로 보낸다. |

## 6. Detail 팝업 규칙

Detail 팝업은 선택 Master의 FAB, AREA, MAKER, MODEL을 보여주지만 수정하지 못하게 한다. Detail의 필수 입력은 공정대분류, 공정중분류, CHAMBER SPEC, 모델관리기준명, MIN SPEC, MAX SPEC, 장비담당자다.

Detail 신규 저장 시 path의 `{specId}`는 부모 Master의 `specId`다. Detail 수정 시 path의 `{specId}`는 Detail row 본인의 `specId`다.

## 7. Paging 기준

Master Grid와 Detail Grid는 B/E가 내려준 전체 row를 F/E에서 `pageSize` 기준으로 자른다. 현재 기본값은 모두 10건이며, 저장된 row ID를 Detail 재조회까지 전달해 해당 페이지와 radio 선택을 복원한다.
