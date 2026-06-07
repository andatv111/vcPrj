/**
 * Action 파일: action.js
 * ------------------------------------------------------------
 * 역할
 * - BIM/5D미적용 Fab 화면에서 발생하는 사용자 이벤트와 비동기 요청을
 *   Redux가 이해할 수 있는 action 객체로 정의합니다.
 *
 * 구분
 * 1. 화면 입력 action
 *    - SET_SEARCH_FIELD
 *    - SELECT_DRAWING
 *    - UPDATE_CHAMBER_FIELD
 *    - UPDATE_PIPE_ROW
 *
 * 2. 비동기 API 요청 action
 *    - FETCH_EQ_SUGGESTIONS_REQUEST
 *    - FETCH_MANUAL_DRAWINGS_REQUEST
 *    - DOWNLOAD_FORELINE_REQUEST
 *    - CALCULATE_REQUEST
 *
 * 3. API 성공/실패 action
 *    - *_SUCCESS
 *    - *_FAILURE
 *
 * 왜 action creator를 쓰는가?
 * - 컴포넌트에서 action 객체를 직접 만들면 오타/구조 불일치가 생기기 쉽습니다.
 * - action creator를 사용하면 payload 구조가 한 곳에 고정되어 유지보수가 쉬워집니다.
 */

/**
 * BIM/5D 미적용 Fab action 정의.
 * 화면 이벤트는 최대한 이 action을 통해 reducer/saga로 흐르게 한다.
 */

export const NON_BIM_ACTION_PREFIX = "vc/nonBim";

// Non-BIM 화면 전용 action type입니다.
// 입력 변경, 도면 조회, 도면 선택, Chamber/배관 편집, 계산 요청을 하나의 흐름으로 추적할 수 있게 분리합니다.
// action type은 문자열 상수로 관리한다.
// 화면/리듀서/saga가 같은 type을 바라보게 하여 오타를 방지한다.
export const NON_BIM_ACTION_TYPES = {
  SET_SEARCH_FIELD: `${NON_BIM_ACTION_PREFIX}/SET_SEARCH_FIELD`,
  RESET_SEARCH: `${NON_BIM_ACTION_PREFIX}/RESET_SEARCH`,

  FETCH_EQ_SUGGESTIONS_REQUEST: `${NON_BIM_ACTION_PREFIX}/FETCH_EQ_SUGGESTIONS_REQUEST`,
  FETCH_EQ_SUGGESTIONS_SUCCESS: `${NON_BIM_ACTION_PREFIX}/FETCH_EQ_SUGGESTIONS_SUCCESS`,
  FETCH_EQ_SUGGESTIONS_FAILURE: `${NON_BIM_ACTION_PREFIX}/FETCH_EQ_SUGGESTIONS_FAILURE`,

  FETCH_MANUAL_DRAWINGS_REQUEST: `${NON_BIM_ACTION_PREFIX}/FETCH_MANUAL_DRAWINGS_REQUEST`,
  FETCH_MANUAL_DRAWINGS_SUCCESS: `${NON_BIM_ACTION_PREFIX}/FETCH_MANUAL_DRAWINGS_SUCCESS`,
  FETCH_MANUAL_DRAWINGS_FAILURE: `${NON_BIM_ACTION_PREFIX}/FETCH_MANUAL_DRAWINGS_FAILURE`,

  SELECT_DRAWING: `${NON_BIM_ACTION_PREFIX}/SELECT_DRAWING`,

  FETCH_MODEL_STANDARD_OPTIONS_SUCCESS: `${NON_BIM_ACTION_PREFIX}/FETCH_MODEL_STANDARD_OPTIONS_SUCCESS`,
  FETCH_MODEL_STANDARD_OPTIONS_FAILURE: `${NON_BIM_ACTION_PREFIX}/FETCH_MODEL_STANDARD_OPTIONS_FAILURE`,

  DOWNLOAD_FORELINE_REQUEST: `${NON_BIM_ACTION_PREFIX}/DOWNLOAD_FORELINE_REQUEST`,
  DOWNLOAD_FORELINE_SUCCESS: `${NON_BIM_ACTION_PREFIX}/DOWNLOAD_FORELINE_SUCCESS`,
  DOWNLOAD_FORELINE_FAILURE: `${NON_BIM_ACTION_PREFIX}/DOWNLOAD_FORELINE_FAILURE`,

  SET_ACTIVE_CHAMBER: `${NON_BIM_ACTION_PREFIX}/SET_ACTIVE_CHAMBER`,
  ADD_CHAMBER: `${NON_BIM_ACTION_PREFIX}/ADD_CHAMBER`,
  REMOVE_CHAMBER: `${NON_BIM_ACTION_PREFIX}/REMOVE_CHAMBER`,
  UPDATE_CHAMBER_FIELD: `${NON_BIM_ACTION_PREFIX}/UPDATE_CHAMBER_FIELD`,

  ADD_PIPE_ROW: `${NON_BIM_ACTION_PREFIX}/ADD_PIPE_ROW`,
  REMOVE_SELECTED_PIPE_ROW: `${NON_BIM_ACTION_PREFIX}/REMOVE_SELECTED_PIPE_ROW`,
  SELECT_PIPE_ROW: `${NON_BIM_ACTION_PREFIX}/SELECT_PIPE_ROW`,
  UPDATE_PIPE_ROW: `${NON_BIM_ACTION_PREFIX}/UPDATE_PIPE_ROW`,

  CALCULATE_REQUEST: `${NON_BIM_ACTION_PREFIX}/CALCULATE_REQUEST`,
  CALCULATE_SUCCESS: `${NON_BIM_ACTION_PREFIX}/CALCULATE_SUCCESS`,
  CALCULATE_FAILURE: `${NON_BIM_ACTION_PREFIX}/CALCULATE_FAILURE`,
};

// action creator 모음.
// 컴포넌트는 이 함수들을 호출하고, reducer/saga는 action.type과 payload를 기준으로 처리한다.
export const nonBimActions = {
  // 조회조건 변경.
// name은 "eqId" 또는 "constructionNo"처럼 search 객체의 key다.
  // dispatch: 검색 input onChange
  // reducer: search[name]만 갱신. eqId 변경은 화면 useEffect를 통해 자동완성 요청으로 이어집니다.
  setSearchField: ({ name, value }) => ({
    type: NON_BIM_ACTION_TYPES.SET_SEARCH_FIELD,
    payload: { name, value },
  }),

  // dispatch: 검색 조건 초기화가 필요할 때 사용
  // reducer: search와 eqSuggestions를 초기 상태로 되돌립니다.
  resetSearch: () => ({
    type: NON_BIM_ACTION_TYPES.RESET_SEARCH,
  }),

  // dispatch: EQ ID 입력값 변경 후 useEffect
  // saga: debounce 후 EQ 자동완성 후보 조회
  fetchEqSuggestionsRequest: (keyword) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST,
    payload: { keyword },
  }),

  // dispatch: fetchEqSuggestionsFlow 성공
  // reducer: datalist에 표시할 eqSuggestions를 저장합니다.
  fetchEqSuggestionsSuccess: (items) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_SUCCESS,
    payload: { items },
  }),

  // dispatch: fetchEqSuggestionsFlow 실패
  // reducer: 후보를 비우고 error를 저장합니다.
  fetchEqSuggestionsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_FAILURE,
    payload: { error },
  }),

  // 조회 버튼 클릭 시 호출.
// 실제 API 호출은 saga의 fetchManualDrawingsFlow에서 수행한다.
  // dispatch: Search 버튼 click
  // saga: 현재 search state로 수기도면 목록 조회
  // reducer: 이전 선택 도면과 Chamber 편집 상태를 초기화합니다.
  fetchManualDrawingsRequest: () => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST,
  }),

  // dispatch: fetchManualDrawingsFlow 성공
  // reducer: normalize된 도면 목록을 drawings에 저장합니다.
  fetchManualDrawingsSuccess: (items) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_SUCCESS,
    payload: { items },
  }),

  // dispatch: fetchManualDrawingsFlow 실패
  // reducer: loading.drawings를 내리고 error를 표시합니다.
  fetchManualDrawingsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_FAILURE,
    payload: { error },
  }),

  // 첫 번째 그리드 Radio 선택.
// reducer에서 선택된 drawing 기준으로 Chamber 탭을 생성한다.
  // dispatch: 도면 결과 radio 선택
  // reducer: selectedDrawing과 chambers를 생성
  // saga: 같은 action을 받아 Model Standard option을 추가 조회합니다.
  selectDrawing: (drawingId) => ({
    type: NON_BIM_ACTION_TYPES.SELECT_DRAWING,
    payload: { drawingId },
  }),

  // dispatch: fetchModelStandardOptionsFlow 성공
  // reducer: 현재 선택 도면과 일치할 때만 specOptions/Min/Max를 보강합니다.
  fetchModelStandardOptionsSuccess: ({ drawingId, options }) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_SUCCESS,
    payload: { drawingId, options },
  }),

  // dispatch: fetchModelStandardOptionsFlow 실패
  // reducer: 기존 입력값은 보존하고 error만 저장합니다.
  fetchModelStandardOptionsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_FAILURE,
    payload: { error },
  }),

  // dispatch: Foreline Download 버튼 click
  // saga: drawingId로 선택 row를 찾아 Blob 다운로드를 실행합니다.
  downloadForelineRequest: (drawingId) => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST,
    payload: { drawingId },
  }),

  // dispatch: downloadForelineFlow 성공
  // reducer: loading.download를 종료합니다.
  downloadForelineSuccess: () => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_SUCCESS,
  }),

  // dispatch: downloadForelineFlow 실패
  // reducer: loading.download를 종료하고 error를 저장합니다.
  downloadForelineFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_FAILURE,
    payload: { error },
  }),

  // dispatch: Chamber tab click
  // reducer: activeChamberId만 바꿔 하단 편집 대상을 전환합니다.
  setActiveChamber: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.SET_ACTIVE_CHAMBER,
    payload: { chamberId },
  }),

  // dispatch: Add Chamber 버튼 click
  // reducer: locked=false 사용자 Chamber 생성. 현재 화면에서는 버튼이 비활성입니다.
  addChamber: () => ({
    type: NON_BIM_ACTION_TYPES.ADD_CHAMBER,
  }),

  // dispatch: Remove Chamber 버튼 click
  // reducer: locked=false Chamber만 삭제하고 activeChamberId를 재계산합니다.
  removeChamber: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.REMOVE_CHAMBER,
    payload: { chamberId },
  }),

  // dispatch: Chamber 정보 input/select 변경
  // reducer: modelStandard 변경 시 연결된 Min/Max Spec도 함께 갱신합니다.
  updateChamberField: ({ chamberId, name, value }) => ({
    type: NON_BIM_ACTION_TYPES.UPDATE_CHAMBER_FIELD,
    payload: { chamberId, name, value },
  }),

  // dispatch: Add Pipe 버튼 click
  // reducer: 대상 Chamber에 기본 PIPE row를 추가합니다.
  addPipeRow: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.ADD_PIPE_ROW,
    payload: { chamberId },
  }),

  // dispatch: Remove Pipe 버튼 click
  // reducer: selectedPipeRowId row를 삭제하고, 마지막 row면 빈 row 하나로 교체합니다.
  removeSelectedPipeRow: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW,
    payload: { chamberId },
  }),

  // dispatch: Pipe table radio 선택
  // reducer: 삭제 대상으로 사용할 selectedPipeRowId를 저장합니다.
  selectPipeRow: ({ chamberId, rowId }) => ({
    type: NON_BIM_ACTION_TYPES.SELECT_PIPE_ROW,
    payload: { chamberId, rowId },
  }),

  // dispatch: Pipe type/select/input 변경
  // reducer: 숫자형 입력을 정리하고 pipe type 정책에 맞게 row를 normalize합니다.
  updatePipeRow: ({ chamberId, rowId, name, value }) => ({
    type: NON_BIM_ACTION_TYPES.UPDATE_PIPE_ROW,
    payload: { chamberId, rowId, name, value },
  }),

  // 산출하기 버튼 클릭.
// saga에서 validation, payload 생성, API 호출을 순서대로 처리한다.
  // dispatch: Calculate 버튼 click
  // saga: 검증, payload 생성, 계산 API 호출, 공용 결과 팝업 열기를 순서대로 처리합니다.
  calculateRequest: () => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_REQUEST,
  }),

  // dispatch: nonBimCalculateFlow 성공
  // reducer: Non-BIM slice는 loading만 종료하고, 결과 데이터는 vcResult slice가 저장합니다.
  calculateSuccess: (result) => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_SUCCESS,
    payload: { result },
  }),

  // dispatch: nonBimCalculateFlow 실패
  // reducer: loading.calculate를 종료하고 error를 저장합니다.
  calculateFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_FAILURE,
    payload: { error },
  }),
};

export default nonBimActions;
