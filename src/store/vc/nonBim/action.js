/**
 * BIM/5D 미적용 Fab 화면 action 정의입니다.
 * 화면은 action creator만 호출하고, 실제 상태 변경은 reducer, API 흐름은 saga가 담당합니다.
 * 첫 번째 그리드 선택 키는 drawingId가 아니라 constructionNo입니다.
 */


export const NON_BIM_ACTION_PREFIX = "vc/nonBim";

// 화면 입력, 조회, 도면 선택, Chamber/배관 편집, 계산 요청을 하나의 흐름으로 추적하기 위한 action type입니다.
// 각 type은 reducer/saga에서 같은 이름으로 분기하므로, 화면 이벤트를 추적할 때 이 목록을 먼저 확인합니다.
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

// payload 구조를 한 곳에 고정해 컴포넌트, reducer, saga 사이의 계약을 맞춥니다.
export const nonBimActions = {
  // 검색 조건 input 변경 시 호출합니다. name은 DEFAULT_SEARCH의 key와 일치해야 합니다.
  setSearchField: ({ name, value }) => ({
    type: NON_BIM_ACTION_TYPES.SET_SEARCH_FIELD,
    payload: { name, value },
  }),

  // 검색 조건과 EQ ID 자동완성 목록을 초기 상태로 되돌립니다.
  resetSearch: () => ({
    type: NON_BIM_ACTION_TYPES.RESET_SEARCH,
  }),

  // EQ ID 입력값으로 자동완성 후보를 조회하도록 saga에 요청합니다.
  fetchEqSuggestionsRequest: (keyword) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST,
    payload: { keyword },
  }),

  // 자동완성 조회 성공 결과를 reducer에 전달합니다.
  fetchEqSuggestionsSuccess: (items) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_SUCCESS,
    payload: { items },
  }),

  // 자동완성 조회 실패 메시지를 reducer에 전달합니다.
  fetchEqSuggestionsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_FAILURE,
    payload: { error },
  }),

  // 검색 버튼 클릭 시 수기 도면 목록 조회를 saga에 요청합니다.
  fetchManualDrawingsRequest: () => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST,
  }),

  // 수기 도면 목록 조회 성공 결과를 화면 그리드에 반영합니다.
  fetchManualDrawingsSuccess: (items) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_SUCCESS,
    payload: { items },
  }),

  // 수기 도면 목록 조회 실패 메시지를 reducer에 전달합니다.
  fetchManualDrawingsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_FAILURE,
    payload: { error },
  }),

  // 첫 번째 그리드 row 선택은 공사번호 기준입니다. drawingKey는 다운로드 보조 키로만 사용합니다.
  selectDrawing: (constructionNo) => ({
    type: NON_BIM_ACTION_TYPES.SELECT_DRAWING,
    payload: { constructionNo },
  }),

  // 선택 도면의 Model Standard 옵션 조회 성공 시, 해당 도면의 Chamber 옵션을 갱신합니다.
  fetchModelStandardOptionsSuccess: ({ constructionNo, options }) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_SUCCESS,
    payload: { constructionNo, options },
  }),

  // Model Standard 옵션 조회 실패를 화면 error 영역에 표시합니다.
  fetchModelStandardOptionsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_FAILURE,
    payload: { error },
  }),

  // Foreline 다운로드도 선택된 공사번호 row를 찾은 뒤 row 안의 drawingKey/fileId를 사용합니다.
  downloadForelineRequest: (constructionNo) => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST,
    payload: { constructionNo },
  }),

  // Foreline 파일 다운로드가 끝나면 download loading을 종료합니다.
  downloadForelineSuccess: () => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_SUCCESS,
  }),

  // Foreline 파일 다운로드 실패 메시지를 reducer에 전달합니다.
  downloadForelineFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_FAILURE,
    payload: { error },
  }),

  // Chamber 탭 클릭 시 활성 Chamber id만 교체합니다.
  setActiveChamber: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.SET_ACTIVE_CHAMBER,
    payload: { chamberId },
  }),

  // 사용자가 직접 입력할 수 있는 새 Chamber 탭을 추가합니다.
  addChamber: () => ({
    type: NON_BIM_ACTION_TYPES.ADD_CHAMBER,
  }),

  // 사용자가 추가한 Chamber만 삭제합니다. 원본 도면에서 온 locked Chamber는 reducer가 막습니다.
  removeChamber: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.REMOVE_CHAMBER,
    payload: { chamberId },
  }),

  // Chamber 이름, Model Standard, 산출대상 여부 같은 단일 필드를 갱신합니다.
  updateChamberField: ({ chamberId, name, value }) => ({
    type: NON_BIM_ACTION_TYPES.UPDATE_CHAMBER_FIELD,
    payload: { chamberId, name, value },
  }),

  // 대상 Chamber에 기본 PIPE row를 추가합니다.
  addPipeRow: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.ADD_PIPE_ROW,
    payload: { chamberId },
  }),

  // 현재 선택된 pipe row를 삭제합니다. 어떤 row가 선택됐는지는 Chamber별 selectedPipeRowId가 갖고 있습니다.
  removeSelectedPipeRow: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW,
    payload: { chamberId },
  }),

  // radio 선택값을 Chamber별 삭제 대상으로 저장합니다.
  selectPipeRow: ({ chamberId, rowId }) => ({
    type: NON_BIM_ACTION_TYPES.SELECT_PIPE_ROW,
    payload: { chamberId, rowId },
  }),

  // 배관 유형 또는 숫자 입력값을 갱신합니다. reducer에서 유형별 사용 불가 필드를 정리합니다.
  updatePipeRow: ({ chamberId, rowId, name, value }) => ({
    type: NON_BIM_ACTION_TYPES.UPDATE_PIPE_ROW,
    payload: { chamberId, rowId, name, value },
  }),

  // 산출하기 버튼 클릭 시 Chamber별 Model Standard/Spec/배관 필수값 검증 후 계산 API로 진입합니다.
  calculateRequest: () => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_REQUEST,
  }),

  // 계산 API 성공 후 nonBim loading을 종료합니다. 결과 데이터 보관과 팝업 open은 vcResult가 담당합니다.
  calculateSuccess: (result) => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_SUCCESS,
    payload: { result },
  }),

  // 계산 API 실패 메시지를 화면 error 영역에 표시합니다.
  calculateFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_FAILURE,
    payload: { error },
  }),
};

export default nonBimActions;
