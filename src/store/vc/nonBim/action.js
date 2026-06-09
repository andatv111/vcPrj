/**
 * BIM/5D 미적용 Fab 화면 action 정의입니다.
 * 화면은 action creator만 호출하고, 실제 상태 변경은 reducer, API 흐름은 saga가 담당합니다.
 * 첫 번째 그리드 선택 키는 drawingId가 아니라 constructionNo입니다.
 */


export const NON_BIM_ACTION_PREFIX = "vc/nonBim";

// 화면 입력, 조회, 도면 선택, Chamber/배관 편집, 계산 요청을 하나의 흐름으로 추적하기 위한 action type입니다.
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
  setSearchField: ({ name, value }) => ({
    type: NON_BIM_ACTION_TYPES.SET_SEARCH_FIELD,
    payload: { name, value },
  }),

  resetSearch: () => ({
    type: NON_BIM_ACTION_TYPES.RESET_SEARCH,
  }),

  fetchEqSuggestionsRequest: (keyword) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST,
    payload: { keyword },
  }),

  fetchEqSuggestionsSuccess: (items) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_SUCCESS,
    payload: { items },
  }),

  fetchEqSuggestionsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_FAILURE,
    payload: { error },
  }),

  fetchManualDrawingsRequest: () => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST,
  }),

  fetchManualDrawingsSuccess: (items) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_SUCCESS,
    payload: { items },
  }),

  fetchManualDrawingsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_FAILURE,
    payload: { error },
  }),

  // 첫 번째 그리드 row 선택은 공사번호 기준입니다. drawingKey는 다운로드 보조 키로만 사용합니다.
  selectDrawing: (constructionNo) => ({
    type: NON_BIM_ACTION_TYPES.SELECT_DRAWING,
    payload: { constructionNo },
  }),

  fetchModelStandardOptionsSuccess: ({ constructionNo, options }) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_SUCCESS,
    payload: { constructionNo, options },
  }),

  fetchModelStandardOptionsFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_FAILURE,
    payload: { error },
  }),

  // Foreline 다운로드도 선택된 공사번호 row를 찾은 뒤 row 안의 drawingKey/fileId를 사용합니다.
  downloadForelineRequest: (constructionNo) => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST,
    payload: { constructionNo },
  }),

  downloadForelineSuccess: () => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_SUCCESS,
  }),

  downloadForelineFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_FAILURE,
    payload: { error },
  }),

  setActiveChamber: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.SET_ACTIVE_CHAMBER,
    payload: { chamberId },
  }),

  addChamber: () => ({
    type: NON_BIM_ACTION_TYPES.ADD_CHAMBER,
  }),

  removeChamber: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.REMOVE_CHAMBER,
    payload: { chamberId },
  }),

  updateChamberField: ({ chamberId, name, value }) => ({
    type: NON_BIM_ACTION_TYPES.UPDATE_CHAMBER_FIELD,
    payload: { chamberId, name, value },
  }),

  addPipeRow: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.ADD_PIPE_ROW,
    payload: { chamberId },
  }),

  removeSelectedPipeRow: (chamberId) => ({
    type: NON_BIM_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW,
    payload: { chamberId },
  }),

  selectPipeRow: ({ chamberId, rowId }) => ({
    type: NON_BIM_ACTION_TYPES.SELECT_PIPE_ROW,
    payload: { chamberId, rowId },
  }),

  updatePipeRow: ({ chamberId, rowId, name, value }) => ({
    type: NON_BIM_ACTION_TYPES.UPDATE_PIPE_ROW,
    payload: { chamberId, rowId, name, value },
  }),

  // 산출하기 버튼 클릭 시 Chamber별 Model Standard/Spec/배관 필수값 검증 후 계산 API로 진입합니다.
  calculateRequest: () => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_REQUEST,
  }),

  calculateSuccess: (result) => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_SUCCESS,
    payload: { result },
  }),

  calculateFailure: (error) => ({
    type: NON_BIM_ACTION_TYPES.CALCULATE_FAILURE,
    payload: { error },
  }),
};

export default nonBimActions;
