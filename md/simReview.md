# BIM/5D Not Applied Fab 코드 이해 문서

> 대상 화면: `Simulation > V/C Simulation > BIM/5D Not Applied Fab`  
> 관련 화면: `V/C Calculator`, `Vacuum Conductance Result`, `기안 첨부 팝업`
> 목적: 초급 개발자가 이 화면의 데이터 흐름, 주요 파일 역할, selector 사용 이유를 코드 기준으로 이해할 수 있게 정리합니다.

---

## 1. 이 화면이 하는 일

이 화면은 BIM/5D가 적용되지 않은 Fab 장비를 대상으로 Manual Drawing을 조회하고, 선택한 도면의 Chamber/Pipe 정보를 입력해 V/C Conductance를 계산합니다.

전체 흐름은 아래 순서입니다.

```txt
화면 진입
-> 세션 user.prjtCd를 FAB 값으로 세팅
-> EQ ID / WO ID 입력
-> Search 버튼 클릭
-> Manual Drawing Results 조회
-> 도면 row 선택
-> 선택 도면의 Chamber 목록 조회
-> Model Standard / Min Spec / Max Spec 확인
-> Pipe row 입력
-> Calculate 버튼 클릭
-> 계산 API 호출
-> Vacuum Conductance Result 팝업 표시
-> Spec Out이면 기안 첨부 정보 입력 후 저장
```

오늘 기준 변경사항은 아래처럼 이해하면 됩니다.

| 변경 | 내용 |
| --- | --- |
| Non-BIM FAB | 콤보가 아니라 세션 `user.prjtCd` 값을 readonly input에 표시합니다. 현재 preview 기본값은 `M16`입니다. |
| Calculator FAB | 콤보는 유지하되 최초 진입 시 세션 `user.prjtCd`가 선택되도록 했습니다. |
| Calculator FAB 잠금 준비 | `SelectField`에 `readOnly` prop을 추가했습니다. 나중에 잠그려면 `readOnly={true}`로 바꾸면 됩니다. |
| Calculator 계산 payload | B/E DTO 기준에 맞게 `fabCd`, `setModelNm`으로 보냅니다. |
| selector 주석 | 작업 흔적처럼 보이는 표현은 제거하고, 운영 코드에서 자연스럽게 읽히는 설명으로 정리했습니다. |

---

## 2. 꼭 기억해야 할 업무 key

| 개념 | 코드 필드 | 설명 |
| --- | --- | --- |
| FAB | `fabCd` | 회사 세션의 `user.prjtCd`입니다. Non-BIM에서는 readonly input, Calculator에서는 combo 초기값으로 사용합니다. |
| 장비 ID | `eqId` | 사용자가 조회 조건에 입력하는 장비 ID입니다. |
| WO ID | `woId` | Manual Drawing Results row 선택과 상세 조회의 기준입니다. |
| 모델명 | `setModelNm` | 장비 model입니다. Calculator 계산 payload에서는 `equipment.setModelNm`으로 보냅니다. |
| 도면 row id | `id` | React 화면 렌더링용 key입니다. 업무 key가 아닙니다. |
| Chamber ID | `chamberId` | B/E chamber key입니다. |
| Chamber 표시명 | `chamberName` | tab 이름입니다. B/E가 준 기존 이름은 그대로 유지합니다. |
| Pipe row id | `rowId` | 화면에서 pipe row를 선택, 수정, 삭제하기 위한 key입니다. |
| 저장 상태 | `requestStatus` | 저장/기안 상태입니다. 특정 상태에서는 Non-BIM Calculate 버튼을 잠급니다. |

정리하면 `eqId`, `woId`, `fabCd`는 B/E 조회와 계산에서 중요하고, `id`, `rowId`는 주로 화면 렌더링과 편집 상태 관리를 위해 필요합니다.

---

## 3. 파일 역할 한눈에 보기

### 화면 파일

| 파일 | 역할 |
| --- | --- |
| `src/components/vc/nonBim/Bim5DNotApplied.js` | Non-BIM 화면 container입니다. Redux state를 읽고 버튼/입력 이벤트를 action으로 보냅니다. |
| `src/components/vc/nonBim/VcCalculator.js` | Calculator 화면 container입니다. FAB/MODEL 선택값과 수기 chamber 계산 흐름을 담당합니다. |
| `src/components/vc/nonBim/ui/DrawingResultTable.js` | Manual Drawing Results grid를 그립니다. |
| `src/components/vc/nonBim/ui/ChamberWorkspace.js` | Chamber tab, Model Standard, Pipe row, Calculate 버튼 영역을 그립니다. |
| `src/components/vc/nonBim/ui/FormFields.js` | 공통 input/select 표시 컴포넌트입니다. `SelectField`의 `readOnly` prop도 여기에 있습니다. |
| `src/components/vc/nonBim/popup/VcResultPopup.js` | 계산 결과 팝업입니다. |
| `src/components/vc/nonBim/popup/VcDraftAttachPopup.js` | Spec Out 저장 시 기안 첨부 정보를 입력하는 팝업입니다. |

### 상태 관리 파일

| 파일 | 역할 |
| --- | --- |
| `src/store/vc/nonBim/action.js` | Non-BIM 화면에서 발생하는 event 이름과 payload 모양을 정의합니다. |
| `src/store/vc/nonBim/reducer.js` | Non-BIM 화면 state를 실제로 변경합니다. |
| `src/store/vc/nonBim/vcSimSelector.js` | Non-BIM state에서 화면이 필요한 값만 꺼내는 함수 모음입니다. |
| `src/store/vc/vcCalculator/reducer.js` | Calculator 화면 state를 변경합니다. |
| `src/store/vc/vcCalculator/vcSimSelector.js` | Calculator state에서 화면이 필요한 값만 꺼냅니다. |
| `src/store/vc/vcResult/reducer.js` | 결과 팝업, 저장, 기안 첨부 state를 변경합니다. |
| `src/store/vc/vcResult/vcSimSelector.js` | 결과 팝업 state에서 화면이 필요한 값만 꺼냅니다. |

### 공통 로직 파일

| 파일 | 역할 |
| --- | --- |
| `src/components/vc/nonBim/core/NonBim.constant.js` | 화면에서 쓰는 고정값, 컬럼, 기본값, pipe type 정책을 관리합니다. |
| `src/components/vc/nonBim/core/NonBim.helper.js` | B/E 응답 정리, validation, payload 생성, 계산 결과 정리를 담당합니다. |
| `src/saga/vc/nonBim/vcSimSaga.js` | action을 받아 API를 호출하고 success/failure action으로 결과를 돌려줍니다. |
| `src/service/api/vc/sim/vcSimApi.js` | 실제 HTTP 요청을 보내는 API adapter입니다. |

---

## 4. 버튼을 클릭하면 실제로 무슨 일이 생기나

문서에서 단순히 `버튼 클릭 -> action`이라고만 쓰면 흐름이 잘 안 잡힙니다. 실제 화면에서는 아래처럼 여러 파일이 역할을 나눠서 움직입니다.

### 4.1 Search 버튼

사용자가 Search 버튼을 누르면 `Bim5DNotApplied.js`의 `handleSearch`가 실행됩니다.

```js
dispatch(nonBimActions.fetchManualDrawingsRequest());
```

이 한 줄은 “도면 목록을 조회해줘”라는 이벤트를 Redux/Saga 쪽으로 보내는 코드입니다.

이후 흐름은 아래와 같습니다.

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `Bim5DNotApplied.js` | EQ ID 필수값을 검사한 뒤 `FETCH_MANUAL_DRAWINGS_REQUEST` action을 dispatch합니다. |
| 2 | `reducer.js` | 기존 drawings, selectedDrawing, chambers를 비우고 `loading.drawings = true`로 바꿉니다. |
| 3 | `vcSimSaga.js` | 현재 검색조건을 읽고 Manual Drawing 조회 API를 호출합니다. |
| 4 | `vcSimApi.js` | `/api/vc/sim/non-bim/manual-drawings`로 HTTP 요청을 보냅니다. |
| 5 | `NonBim.helper.js` | B/E 응답을 화면 grid에서 쓰기 좋은 row 모양으로 정리합니다. |
| 6 | `reducer.js` | 조회된 drawings를 state에 저장하고 loading을 끕니다. |
| 7 | `vcSimSelector.js` | 화면이 `selectDrawings`로 drawings를 읽습니다. |
| 8 | `DrawingResultTable.js` | 새 drawings로 grid를 다시 그립니다. |

즉 버튼이 API를 직접 호출하는 것이 아닙니다. 버튼은 action을 보내고, API 호출은 saga가 담당합니다.

### 4.2 Manual Drawing row 선택

Manual Drawing Results에서 row를 선택하면 아래 action이 실행됩니다.

```js
dispatch(nonBimActions.selectDrawing(woId));
```

여기서 중요한 값은 `woId`입니다. 이 화면은 선택 도면을 `woId` 기준으로 찾습니다.

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `DrawingResultTable.js` | 사용자가 선택한 row의 `woId`를 상위 컴포넌트로 전달합니다. |
| 2 | `Bim5DNotApplied.js` | `selectDrawing(woId)` action을 dispatch합니다. |
| 3 | `reducer.js` | drawings에서 같은 `woId`를 가진 row를 찾아 `selectedDrawing`에 저장합니다. |
| 4 | `reducer.js` | 기존 chamber를 비우고 `loading.chambers = true`로 바꿉니다. |
| 5 | `vcSimSaga.js` | 선택된 도면 기준으로 chamber 조회 API와 model standard option 조회 API를 호출합니다. |
| 6 | `reducer.js` | 응답받은 chamber 목록을 state에 저장하고 첫 chamber를 active로 둡니다. |
| 7 | `vcSimSelector.js` | `selectChambers`, `selectActiveChamber`로 chamber 정보를 화면에 제공합니다. |
| 8 | `ChamberWorkspace.js` | chamber tab과 pipe 입력 영역을 다시 그립니다. |

여기서 selector가 없다면 화면이 `state.vc.nonBim.chambers` 같은 긴 경로를 직접 알아야 합니다. selector를 쓰면 화면은 “chambers를 주세요”라고만 말하면 됩니다.

### 4.3 Add Chamber 버튼

Add Chamber 버튼은 사용자가 직접 입력할 새 chamber를 추가합니다.

```js
dispatch(nonBimActions.addChamber());
```

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `ChamberWorkspace.js` | Add Chamber 버튼 클릭을 상위로 알립니다. |
| 2 | `Bim5DNotApplied.js` | `ADD_CHAMBER` action을 dispatch합니다. |
| 3 | `reducer.js` | `createUserChamber` helper로 새 chamber 객체를 만듭니다. |
| 4 | `reducer.js` | 새 chamber를 `chambers` 배열에 추가하고 active chamber로 지정합니다. |
| 5 | `vcSimSelector.js` | `selectActiveChamber`가 방금 추가된 chamber를 찾아 반환합니다. |
| 6 | `ChamberWorkspace.js` | 새 chamber tab과 입력 영역을 표시합니다. |

기존 B/E chamber는 `locked` 성격이 있을 수 있고, 사용자가 추가한 chamber는 삭제 가능하도록 구분됩니다.

### 4.4 Pipe row 값 변경

Pipe row에서 값을 수정하면 아래 action이 실행됩니다.

```js
dispatch(
  nonBimActions.updatePipeRow({
    chamberId,
    rowId,
    name,
    value,
  })
);
```

이 payload는 “어느 chamber의 어느 row에서 어떤 필드를 어떤 값으로 바꿀지”를 모두 담고 있습니다.

| 값 | 의미 |
| --- | --- |
| `chamberId` | 수정 대상 chamber |
| `rowId` | 수정 대상 pipe row |
| `name` | 바뀐 field 이름 |
| `value` | 사용자가 입력한 값 |

`reducer.js`는 이 값을 받아 해당 row만 바꿉니다. Pipe Type이 바뀌면 `NonBim.helper.js`의 `normalizePipeRowByType`을 사용해 해당 type에서 쓰지 않는 필드를 정리합니다.

### 4.5 Calculate 버튼

Calculate 버튼은 현재 선택 도면, chamber, pipe 입력값을 모아서 계산 API로 보냅니다.

```js
dispatch(nonBimActions.calculateRequest());
```

| 단계 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `Bim5DNotApplied.js` | Calculate 버튼 클릭 시 `CALCULATE_REQUEST` action을 dispatch합니다. |
| 2 | `vcSimSaga.js` | 현재 state에서 검색조건, 선택 도면, chamber 정보를 읽습니다. |
| 3 | `NonBim.helper.js` | `validateNonBimBeforeCalculate`로 필수 입력값을 검사합니다. |
| 4 | `NonBim.helper.js` | `buildNonBimCalculatePayload`로 B/E에 보낼 Request Json을 만듭니다. |
| 5 | `vcSimApi.js` | 계산 API를 호출합니다. |
| 6 | `NonBim.helper.js` | 계산 결과를 팝업 table row로 정리합니다. |
| 7 | `vcResult/reducer.js` | 결과 팝업 state를 열고 rows를 저장합니다. |
| 8 | `vcResult/vcSimSelector.js` | 팝업이 `visible`, `rows`, `basicInfo`를 읽습니다. |
| 9 | `VcResultPopup.js` | 계산 결과를 사용자에게 보여줍니다. |

---

## 5. `vcSimSelector.js`를 왜 쓰는가

`vcSimSelector.js`는 Redux state를 읽는 전용 함수 파일입니다.

처음에는 아래 코드가 더 쉬워 보일 수 있습니다.

```js
const drawings = useSelector((state) => state.vc.nonBim.drawings);
```

하지만 화면마다 이런 코드를 직접 쓰면 문제가 생깁니다.

| 문제 | 설명 |
| --- | --- |
| state 구조를 화면이 알아야 함 | 화면 컴포넌트가 `state.vc.nonBim` 같은 내부 경로를 모두 알아야 합니다. |
| 구조 변경에 약함 | 나중에 store 구조가 바뀌면 화면 파일 여러 개를 고쳐야 합니다. |
| fallback 처리 반복 | 초기 렌더링이나 테스트에서 state가 비어 있을 때 안전한 기본값을 매번 처리해야 합니다. |
| 이름만 봐도 의미가 안 보임 | `state.vc.nonBim.drawings`보다 `selectDrawings`가 업무 의미를 더 잘 드러냅니다. |

그래서 이 프로젝트는 아래처럼 씁니다.

```js
const drawings = useSelector(selectDrawings);
```

이렇게 하면 화면은 Redux 내부 구조를 몰라도 됩니다. 화면은 selector에게 “도면 목록 주세요”라고 요청하고, selector가 정확한 위치에서 값을 꺼내옵니다.

---

## 6. Non-BIM `vcSimSelector.js` 자세히 보기

파일 위치:

```txt
src/store/vc/nonBim/vcSimSelector.js
```

### 6.1 핵심 입구: `selectNonBimState`

```js
export const selectNonBimState = (state) => {
  return (
    state?.vc?.nonBim ||
    state?.nonBim ||
    state?.vcNonBim ||
    initialNonBimState
  );
};
```

이 함수는 Non-BIM state 전체를 가져오는 입구입니다.

왜 여러 경로를 보나요?

| 코드 | 의미 |
| --- | --- |
| `state?.vc?.nonBim` | 현재 프로젝트에서 정상적으로 쓰는 위치입니다. |
| `state?.nonBim` | 테스트나 다른 store 결합 방식에서 쓸 수 있는 fallback입니다. |
| `state?.vcNonBim` | 예전 또는 임시 결합 방식까지 방어하는 fallback입니다. |
| `initialNonBimState` | 아직 store가 준비되지 않아도 화면이 깨지지 않게 하는 기본값입니다. |

이 함수 하나가 있기 때문에 화면 컴포넌트는 store 구조 변경을 직접 신경 쓰지 않아도 됩니다. 구조가 바뀌면 대부분 selector 파일만 고치면 됩니다.

### 6.2 검색조건 읽기: `selectSearch`

```js
export const selectSearch = (state) => selectNonBimState(state).search;
```

반환값 예시:

```json
{
  "fabCd": "M16",
  "eqId": "ANDATV111",
  "woId": ""
}
```

어디서 쓰나요?

```js
const search = useSelector(selectSearch);
```

`Bim5DNotApplied.js`는 이 값을 Search Conditions input에 표시합니다. 사용자가 EQ ID나 WO ID를 바꾸면 `SET_SEARCH_FIELD` action으로 reducer가 `search` 값을 갱신하고, selector가 다시 최신 `search`를 화면에 전달합니다.

### 6.3 option 읽기: `selectNonBimOptions`

```js
export const selectNonBimOptions = (state) => selectNonBimState(state).options;
```

반환값 예시:

```json
{
  "fabs": [
    { "value": "M16", "label": "M16" }
  ],
  "pipeTypes": [
    { "value": "ROUND", "label": "ROUND" },
    { "value": "RECT", "label": "RECT" }
  ]
}
```

Non-BIM에서는 FAB 콤보를 제거했지만 pipe type option은 계속 필요합니다. `ChamberWorkspace.js`로 `pipeTypeOptions={options.pipeTypes}`를 넘겨 pipe row의 Pipe Type select를 그립니다.

### 6.4 EQ 자동완성 읽기: `selectEqSuggestions`

```js
export const selectEqSuggestions = (state) => selectNonBimState(state).eqSuggestions;
```

EQ ID input은 datalist를 사용합니다. 사용자가 EQ ID를 입력하면 saga가 자동완성 후보를 조회하고 reducer가 `eqSuggestions`에 저장합니다.

이후 화면은 selector로 읽습니다.

```js
const eqSuggestions = useSelector(selectEqSuggestions);
```

그리고 아래처럼 datalist option으로 렌더링합니다.

```js
{eqSuggestions.map((item) => (
  <option key={item.value} value={item.value}>
    {item.label}
  </option>
))}
```

### 6.5 도면 목록 읽기: `selectDrawings`

```js
export const selectDrawings = (state) => selectNonBimState(state).drawings;
```

Search 버튼으로 조회된 Manual Drawing Results rows입니다.

반환값 예시:

```json
[
  {
    "id": "M16-ANDATV111-001",
    "woId": "WO-20260618-001",
    "eqId": "ANDATV111",
    "fabCd": "M16",
    "setModelNm": "PUMP-A",
    "requestStatus": "DRAFT"
  }
]
```

`Bim5DNotApplied.js`는 이 값을 `DrawingResultTable`에 넘깁니다.

```js
<DrawingResultTable drawings={drawings} />
```

### 6.6 선택 도면 읽기: `selectSelectedDrawing`

```js
export const selectSelectedDrawing = (state) => selectNonBimState(state).selectedDrawing;
```

Manual Drawing Results에서 row를 선택하면 reducer가 해당 row를 `selectedDrawing`에 저장합니다.

이 값은 아래 용도로 쓰입니다.

| 사용처 | 이유 |
| --- | --- |
| `ChamberWorkspace` | 어떤 도면의 chamber를 편집 중인지 알아야 합니다. |
| Calculate payload | 계산 API에 장비/도면 context를 보내야 합니다. |
| Calculate 잠금 판단 | `requestStatus`에 따라 버튼을 숨기거나 막아야 합니다. |
| Result popup 기본정보 | 결과 팝업 상단에 장비/도면 정보를 표시해야 합니다. |

### 6.7 선택 WO ID 읽기: `selectSelectedWoId`

```js
export const selectSelectedWoId = (state) => selectNonBimState(state).selectedWoId;
```

`selectedWoId`는 grid에서 현재 선택된 row를 표시하는 데 씁니다.

`selectedDrawing` 전체 객체도 있는데 왜 `selectedWoId`가 따로 있나요?

| 값 | 역할 |
| --- | --- |
| `selectedWoId` | grid에서 어떤 row가 선택됐는지 빠르게 비교합니다. |
| `selectedDrawing` | 계산 payload, chamber 조회, 상태 판단에 필요한 상세 정보를 담습니다. |

row 선택 표시에는 전체 객체보다 `woId` 하나가 더 단순하고 안정적입니다.

### 6.8 Chamber 목록 읽기: `selectChambers`

```js
export const selectChambers = (state) => selectNonBimState(state).chambers;
```

선택한 도면의 chamber tab 목록입니다.

반환값 예시:

```json
[
  {
    "id": "CH-001",
    "chamberId": "CH-001",
    "chamberName": "MAIN CHAMBER",
    "modelStandard": "STD-001",
    "minSpec": "10",
    "maxSpec": "20",
    "pipes": []
  }
]
```

`ChamberWorkspace.js`는 이 배열을 기준으로 tab을 그립니다. B/E가 내려준 `chamberName`은 유지하고, 사용자가 새로 추가한 chamber만 `CHAMBER{n}` 형식으로 이름을 붙입니다.

### 6.9 현재 chamber id 읽기: `selectActiveChamberId`

```js
export const selectActiveChamberId = (state) => selectNonBimState(state).activeChamberId;
```

현재 사용자가 보고 있거나 편집 중인 chamber id입니다.

tab을 누르면 `SET_ACTIVE_CHAMBER` action이 실행되고 reducer가 `activeChamberId`를 바꿉니다. 그러면 selector가 새 id를 읽고 화면이 해당 chamber 내용을 보여줍니다.

### 6.10 현재 chamber 객체 읽기: `selectActiveChamber`

```js
export const selectActiveChamber = (state) => {
  const current = selectNonBimState(state);
  return findActiveChamber(current.chambers, current.activeChamberId);
};
```

이 함수는 `activeChamberId`에 해당하는 chamber 객체를 찾아 반환합니다.

여기서 중요한 helper가 `findActiveChamber`입니다.

```txt
chambers 배열에서 activeChamberId와 같은 id를 찾음
-> 없으면 첫 번째 chamber를 fallback으로 반환
-> chamber가 하나도 없으면 null 반환
```

왜 fallback이 필요할까요?

예를 들어 사용자가 현재 active chamber를 삭제하면 `activeChamberId`가 더 이상 유효하지 않을 수 있습니다. 이때 화면이 바로 깨지지 않도록 첫 번째 chamber로 보정합니다.

### 6.11 loading 읽기: `selectLoading`

```js
export const selectLoading = (state) => selectNonBimState(state).loading;
```

반환값 예시:

```json
{
  "options": false,
  "eqSuggestions": false,
  "drawings": false,
  "chambers": false,
  "download": false,
  "calculate": false
}
```

화면은 loading 값으로 버튼을 disabled 처리하거나 `Searching...` 같은 상태 문구를 표시합니다.

예시:

```js
<button disabled={loading.drawings}>
  {loading.drawings ? "Searching..." : "Search"}
</button>
```

### 6.12 error 읽기: `selectError`

```js
export const selectError = (state) => selectNonBimState(state).error;
```

saga/API에서 실패가 발생하면 reducer가 error 메시지를 저장합니다. 화면은 selector로 error를 읽어 error box를 보여줍니다.

---

## 7. selector를 실제 코드에서 어떻게 쓰는가

`Bim5DNotApplied.js` 상단을 보면 아래처럼 selector를 import합니다.

```js
import {
  selectActiveChamber,
  selectChambers,
  selectDrawings,
  selectEqSuggestions,
  selectError,
  selectLoading,
  selectNonBimOptions,
  selectSearch,
  selectSelectedWoId,
  selectSelectedDrawing,
} from "../../../store/vc/nonBim/vcSimSelector";
```

그리고 component 안에서 이렇게 씁니다.

```js
const search = useSelector(selectSearch);
const options = useSelector(selectNonBimOptions);
const eqSuggestions = useSelector(selectEqSuggestions);
const drawings = useSelector(selectDrawings);
const selectedWoId = useSelector(selectSelectedWoId);
const selectedDrawing = useSelector(selectSelectedDrawing);
const chambers = useSelector(selectChambers);
const activeChamber = useSelector(selectActiveChamber);
const loading = useSelector(selectLoading);
const error = useSelector(selectError);
```

이 코드는 “화면에서 필요한 state 목록”입니다.

| selector | 화면에서 하는 일 |
| --- | --- |
| `selectSearch` | FAB/EQ ID/WO ID input 값 표시 |
| `selectNonBimOptions` | Pipe Type select option 제공 |
| `selectEqSuggestions` | EQ ID 자동완성 datalist 표시 |
| `selectDrawings` | Manual Drawing Results grid 표시 |
| `selectSelectedWoId` | grid에서 선택 row highlight |
| `selectSelectedDrawing` | chamber 표시 여부, calculate 잠금, payload context 판단 |
| `selectChambers` | chamber tab 목록 표시 |
| `selectActiveChamber` | 현재 tab의 Model Standard/Pipe 입력값 표시 |
| `selectLoading` | 조회중/계산중 버튼 상태 표시 |
| `selectError` | 오류 메시지 표시 |

여기서 핵심은 화면이 “Redux state의 구조”를 직접 모른다는 점입니다. 화면은 selector 이름만 보고 필요한 값을 가져옵니다.

---

## 8. Calculator selector는 Non-BIM과 무엇이 다른가

파일 위치:

```txt
src/store/vc/vcCalculator/vcSimSelector.js
```

Calculator는 B/E 도면 row를 선택하는 화면이 아닙니다. 사용자가 FAB, MODEL, chamber, pipe 정보를 직접 구성해서 계산합니다.

| selector | 반환값 | 어디에 쓰나 |
| --- | --- | --- |
| `selectVcCalculatorEquipment` | `{ fab, model }` | Search Conditions의 FAB/MODEL combo |
| `selectVcCalculatorOptions` | FAB, MODEL, Model Standard, Pipe Type options | combo option |
| `selectVcCalculatorChambers` | 수기 chamber 목록 | chamber tab |
| `selectVcCalculatorActiveChamber` | 현재 선택 chamber | 입력 영역 |
| `selectVcCalculatorLoading` | loading flags | 버튼 disabled |
| `selectVcCalculatorError` | 오류 메시지 | error box |
| `selectCanSelectModelStandard` | Model Standard 선택 가능 여부 | FAB/MODEL이 모두 선택된 뒤 활성화 |

이번 변경에서 Calculator FAB는 combo를 유지합니다. 다만 화면 최초 진입 시 세션 `user.prjtCd`를 읽어서 `equipment.fab` 초기값으로 넣습니다.

흐름은 아래와 같습니다.

```txt
VcCalculator.js에서 user.prjtCd 읽기
-> equipment.fab이 비어 있으면 SET_EQUIPMENT_FIELD dispatch
-> reducer가 equipment.fab 저장
-> selectVcCalculatorEquipment가 equipment 반환
-> FAB combo가 M16 선택 상태로 표시
```

---

## 9. Result selector는 왜 따로 있는가

파일 위치:

```txt
src/store/vc/vcResult/vcSimSelector.js
```

계산 결과 팝업은 Non-BIM과 Calculator가 같이 씁니다. 그래서 결과 팝업 state는 `nonBim`이나 `vcCalculator` 안에 넣지 않고 `vcResult`로 분리했습니다.

| selector | 반환값 | 어디에 쓰나 |
| --- | --- | --- |
| `selectVcResultVisible` | 팝업 표시 여부 | `VcResultPopup` open/close |
| `selectVcResultBasicInfo` | 결과 상단 기본정보 | FAB, EQ ID, MODEL 등 표시 |
| `selectVcResultRows` | 결과 table rows | conductance/judge table 표시 |
| `selectVcResultLoading` | 저장 API 진행 상태 | Save 버튼 disabled |
| `selectVcResultError` | 오류 메시지 | 팝업 error 표시 |
| `selectVcResultSavedInfo` | 저장 성공 후 정보 | 저장 후속 처리 |
| `selectVcResultDraftPopup` | 기안 첨부 팝업 상태 | Spec Out 저장 시 사용 |
| `selectVcResultHasSpecOut` | Spec Out 여부 | 기안 첨부 필요 여부 판단 |
| `selectVcResultHasNaRows` | N/A row 존재 여부 | 계산 제외/스펙 미적용 row 판단 |

Result selector를 분리한 이유는 “계산 결과 팝업은 두 화면이 함께 쓰는 공통 결과 모델”이기 때문입니다.

---

## 10. `NonBim.constant.js` 이해하기

파일 위치:

```txt
src/components/vc/nonBim/core/NonBim.constant.js
```

constant 파일은 코드 여러 곳에서 같이 쓰는 고정값을 모아둔 곳입니다.

| 항목 | 설명 |
| --- | --- |
| `DEFAULT_SEARCH` | Non-BIM 검색조건 기본값입니다. |
| `DEFAULT_LOADING` | loading flag 기본값입니다. |
| `PIPE_TYPE` | Pipe Type 코드입니다. |
| `PIPE_TYPE_FIELD_POLICY` | Pipe Type별로 어떤 입력 필드를 쓰고 지울지 정합니다. |
| `PIPE_COLUMNS` | Pipe row table column 정의입니다. |
| `RESULT_COLUMNS` | 결과 팝업 table column 정의입니다. |
| `JUDGE` | 결과 판정 코드입니다. 예: `OK`, `HIGH_OUT`, `LOW_OUT`, `NA` |

### `PIPE_TYPE_FIELD_POLICY`가 중요한 이유

Pipe Type에 따라 필요한 입력값이 다릅니다.

예를 들어 ROUND pipe는 diameter가 중요하고, RECT pipe는 width/height가 중요할 수 있습니다. 사용자가 Pipe Type을 바꿨는데 이전 type에서 쓰던 값이 그대로 남아 있으면 잘못된 계산 payload가 만들어질 수 있습니다.

그래서 reducer는 pipe type이 바뀔 때 helper를 통해 필요 없는 필드를 정리합니다.

```txt
Pipe Type 변경
-> UPDATE_PIPE_ROW action
-> reducer
-> normalizePipeRowByType
-> 해당 type에서 쓰지 않는 값 제거
-> 화면 state 갱신
```

---

## 11. `NonBim.helper.js` 이해하기

파일 위치:

```txt
src/components/vc/nonBim/core/NonBim.helper.js
```

helper 파일은 화면과 API 사이에서 데이터 모양을 맞추는 곳입니다.

### 11.1 B/E 응답을 화면 row로 정리

B/E 응답 필드명과 화면 table 필드명이 항상 같지는 않습니다. 그래서 helper에서 화면이 쓰기 좋은 형태로 바꿉니다.

```txt
B/E response
-> normalizeManualDrawing
-> DrawingResultTable row
```

이렇게 해두면 table 컴포넌트는 B/E 원본 필드명을 몰라도 됩니다.

### 11.2 계산 전 validation

계산 API를 호출하기 전에 필수값을 검사합니다.

```txt
selectedDrawing이 있는가
chamber가 있는가
Model Standard가 있는가
Pipe row 필수값이 있는가
```

Non-BIM은 도면 기반 계산이므로 필수값 검사가 비교적 엄격합니다. Calculator는 수기 계산 화면이기 때문에 일부 spec이 없어도 `N/A` 결과를 허용하는 흐름이 있습니다.

### 11.3 계산 Request Json 생성

화면 state를 그대로 API에 보내면 안 됩니다. 화면 state에는 UI 편집용 값도 섞여 있습니다.

그래서 helper에서 B/E가 이해하는 Request Json으로 바꿉니다.

```txt
search + selectedDrawing + chambers
-> buildNonBimCalculatePayload
-> B/E calculate request
```

Calculator는 별도 helper를 씁니다.

```txt
equipment + chambers
-> buildCalculatorCalculatePayload
-> B/E calculator calculate request
```

이번 변경으로 Calculator payload의 장비 정보는 아래처럼 B/E DTO에 맞춰 보냅니다.

```json
{
  "equipment": {
    "eqId": "",
    "fabCd": "M16",
    "fabNm": "M16",
    "setModelNm": "MODEL-A",
    "operLargeCatgVal": "Manual",
    "operMidCatgVal": "Calculator"
  }
}
```

### 11.4 계산 결과 정리

B/E 계산 응답도 바로 팝업에 넣지 않고 helper에서 정리합니다.

```txt
B/E calculate response
-> normalizeCalculationResult
-> vcResult rows
-> VcResultPopup 표시
```

이렇게 하면 Non-BIM과 Calculator가 같은 결과 팝업을 공유할 수 있습니다.

---

## 12. Redux 흐름을 한 문장으로 잡기

Redux 흐름은 아래처럼 보면 됩니다.

```txt
Component는 사용자 이벤트를 action으로 보낸다.
Reducer는 action을 받아 state를 바꾼다.
Saga는 API가 필요한 action을 받아 API를 호출한다.
Selector는 state에서 화면이 필요한 값만 꺼내준다.
Helper는 화면 데이터와 API 데이터의 모양을 서로 맞춰준다.
```

각 역할을 코드 기준으로 다시 보면 아래와 같습니다.

| 역할 | 대표 파일 | 이 화면에서 하는 일 |
| --- | --- | --- |
| Component | `Bim5DNotApplied.js` | 버튼 클릭, input 변경, child component 연결 |
| Action | `action.js` | `FETCH_MANUAL_DRAWINGS_REQUEST` 같은 이벤트 이름 정의 |
| Reducer | `reducer.js` | `search`, `drawings`, `selectedDrawing`, `chambers` 값 변경 |
| Saga | `vcSimSaga.js` | 조회/다운로드/계산/저장 API 호출 |
| Selector | `vcSimSelector.js` | 화면이 필요한 state만 읽어 반환 |
| Helper | `NonBim.helper.js` | validation, payload 생성, response 정리 |
| API | `vcSimApi.js` | HTTP 요청 실행 |

---

## 13. Non-BIM과 Calculator 차이

| 항목 | Non-BIM | Calculator |
| --- | --- | --- |
| FAB | 세션 `user.prjtCd`를 readonly input으로 표시 | combo 유지, 세션 `user.prjtCd`를 최초 선택값으로 설정 |
| 장비/도면 | Manual Drawing Results에서 선택 | 사용자가 FAB/MODEL을 직접 선택 |
| Chamber | 선택한 도면의 B/E chamber 조회 후 사용 | 사용자가 직접 chamber 구성 |
| Calculate validation | 도면/Chamber/Pipe 필수값 중심 | 일부 값이 없어도 N/A 결과 허용 가능 |
| Payload builder | `buildNonBimCalculatePayload` | `buildCalculatorCalculatePayload` |
| 결과 팝업 | `vcResult` 공통 사용 | `vcResult` 공통 사용 |

---

## 14. 자주 헷갈리는 질문

### Q1. selector는 state를 바꾸나요?

아니요. selector는 읽기만 합니다.

state를 바꾸는 것은 reducer입니다. API를 호출하는 것은 saga입니다. selector는 state에서 필요한 값을 꺼내 화면에 전달할 뿐입니다.

### Q2. `selectActiveChamber`는 왜 단순히 id만 반환하지 않나요?

화면은 현재 chamber의 `modelStandard`, `minSpec`, `maxSpec`, `pipes` 같은 전체 정보가 필요합니다. 그래서 `activeChamberId`만 읽는 것이 아니라 실제 chamber 객체를 찾아 반환합니다.

### Q3. row 선택에 왜 `woId`를 쓰나요?

이 화면의 첫 번째 grid에서 사용자가 선택하는 업무 기준이 WO ID이기 때문입니다. React 렌더링용 `id`와 업무 선택 기준인 `woId`를 구분해야 합니다.

### Q4. 왜 Component에서 API를 바로 부르지 않나요?

API 호출을 component에 넣으면 화면 코드가 복잡해지고 loading/error 처리도 흩어집니다. 이 프로젝트는 saga가 API 호출을 맡고, component는 action dispatch만 하도록 나눴습니다.

### Q5. helper와 selector는 둘 다 함수인데 뭐가 다른가요?

selector는 Redux state를 읽는 함수입니다.

helper는 데이터 모양 변경, validation, payload 생성처럼 화면/API 사이의 계산과 변환을 담당하는 함수입니다.

### Q6. `initialNonBimState` fallback은 왜 필요한가요?

초기 렌더링, 테스트, store 연결 전 상황에서 state가 아직 없을 수 있습니다. selector가 기본값을 반환하면 화면이 바로 오류로 죽지 않고 빈 상태로 렌더링됩니다.

---

## 15. 수정할 때 어디를 봐야 하나

| 하고 싶은 일 | 먼저 볼 파일 |
| --- | --- |
| Search Conditions 필드 추가/변경 | `Bim5DNotApplied.js`, `action.js`, `reducer.js`, `vcSimSelector.js` |
| FAB 세션값 처리 변경 | `Bim5DNotApplied.js`, `VcCalculator.js` |
| Manual Drawing grid 컬럼 변경 | `ui/DrawingResultTable.js`, `NonBim.helper.js`, `md/SIM_API.md` |
| row 선택 후 chamber 조회 흐름 변경 | `reducer.js`, `vcSimSaga.js`, `vcSimSelector.js` |
| Chamber tab 동작 변경 | `ui/ChamberWorkspace.js`, `reducer.js`, `NonBim.helper.js` |
| Pipe Type별 입력 필드 변경 | `NonBim.constant.js`, `NonBim.helper.js`, `reducer.js` |
| Calculate payload 변경 | `NonBim.helper.js`, `vcSimSaga.js`, `md/SIM_API.md` |
| 결과 팝업 표시 변경 | `VcResultPopup.js`, `vcResult/reducer.js`, `vcResult/vcSimSelector.js` |
| 저장/기안 첨부 흐름 변경 | `vcResult/reducer.js`, `vcSimSaga.js`, `VcDraftAttachPopup.js` |

---

## 16. 초급 개발자용 읽는 순서

처음부터 모든 파일을 동시에 보면 헷갈립니다. 아래 순서로 보면 흐름이 잡힙니다.

1. `Bim5DNotApplied.js`
   화면이 어떤 selector를 읽고 어떤 action을 dispatch하는지 봅니다.

2. `src/store/vc/nonBim/action.js`
   화면에서 보낸 action 이름과 payload를 확인합니다.

3. `src/store/vc/nonBim/reducer.js`
   action을 받으면 state가 어떻게 바뀌는지 확인합니다.

4. `src/store/vc/nonBim/vcSimSelector.js`
   바뀐 state를 화면이 어떤 selector로 다시 읽는지 확인합니다.

5. `src/saga/vc/nonBim/vcSimSaga.js`
   API가 필요한 action은 어떤 endpoint로 이어지는지 확인합니다.

6. `src/components/vc/nonBim/core/NonBim.helper.js`
   API 요청/응답 모양이 화면용 데이터로 어떻게 바뀌는지 확인합니다.

이 순서로 보면 “버튼 클릭”, “state 변경”, “API 호출”, “화면 재표시”가 한 흐름으로 이어집니다.
