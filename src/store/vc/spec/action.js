export const SPEC_MASTER_ACTION_PREFIX = "vc/specMaster";

// Spec Master 화면의 콤보, grid, popup 저장 흐름을 한 slice에서 관리한다.
export const SPEC_MASTER_ACTION_TYPES = {
  // 화면 진입 시 콤보 API와 grid API를 순서대로 호출한다.
  INIT_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/INIT_REQUEST`,
  INIT_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/INIT_SUCCESS`,
  INIT_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/INIT_FAILURE`,

  // 검색조건 입력 값만 변경하고 실제 조회는 SEARCH_REQUEST에서 수행한다.
  SET_SEARCH_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_SEARCH_FIELD`,
  RESET_SEARCH: `${SPEC_MASTER_ACTION_PREFIX}/RESET_SEARCH`,
  FETCH_SPEC_NAME_SUGGESTIONS_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_SPEC_NAME_SUGGESTIONS_REQUEST`,
  FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS`,
  FETCH_SPEC_NAME_SUGGESTIONS_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_SPEC_NAME_SUGGESTIONS_FAILURE`,

  // GoodDocs POST /api/vc/specmaster/selectcondition 호출 결과를 grid에 반영한다.
  SEARCH_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_REQUEST`,
  SEARCH_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_SUCCESS`,
  SEARCH_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_FAILURE`,

  SELECT_MASTER: `${SPEC_MASTER_ACTION_PREFIX}/SELECT_MASTER`,
  SELECT_DETAIL: `${SPEC_MASTER_ACTION_PREFIX}/SELECT_DETAIL`,

  OPEN_CREATE_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/OPEN_CREATE_POPUP`,
  OPEN_EDIT_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/OPEN_EDIT_POPUP`,
  HYDRATE_POPUP_FORM: `${SPEC_MASTER_ACTION_PREFIX}/HYDRATE_POPUP_FORM`,
  CLOSE_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/CLOSE_POPUP`,
  SET_POPUP_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_POPUP_FIELD`,

  SAVE_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/SAVE_REQUEST`,
  SAVE_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/SAVE_SUCCESS`,
  SAVE_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/SAVE_FAILURE`,

  DELETE_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/DELETE_REQUEST`,
  DELETE_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/DELETE_SUCCESS`,
  DELETE_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/DELETE_FAILURE`,
};

export const specMasterActions = {
  initRequest: () => ({ type: SPEC_MASTER_ACTION_TYPES.INIT_REQUEST }),
  initSuccess: (options) => ({ type: SPEC_MASTER_ACTION_TYPES.INIT_SUCCESS, payload: { options } }),
  initFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.INIT_FAILURE, payload: { error } }),

  setSearchField: ({ name, value }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SET_SEARCH_FIELD,
    payload: { name, value },
  }),
  resetSearch: () => ({ type: SPEC_MASTER_ACTION_TYPES.RESET_SEARCH }),
  fetchSpecNameSuggestionsRequest: (keyword) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_REQUEST,
    payload: { keyword },
  }),
  fetchSpecNameSuggestionsSuccess: (items) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS,
    payload: { items },
  }),
  fetchSpecNameSuggestionsFailure: (error) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_FAILURE,
    payload: { error },
  }),

  searchRequest: ({ selectedSpecId, selectedDetailSpecId } = {}) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST,
    payload: { selectedSpecId, selectedDetailSpecId },
  }),
  searchSuccess: ({ rows, details, selectedSpecId, selectedDetailSpecId }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS,
    payload: { rows, details, selectedSpecId, selectedDetailSpecId },
  }),
  searchFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.SEARCH_FAILURE, payload: { error } }),

  selectMaster: (specId, selectedDetailSpecId = "") => ({
    type: SPEC_MASTER_ACTION_TYPES.SELECT_MASTER,
    payload: { specId, selectedDetailSpecId },
  }),
  selectDetail: (specId) => ({ type: SPEC_MASTER_ACTION_TYPES.SELECT_DETAIL, payload: { specId } }),

  openCreatePopup: (scope) => ({ type: SPEC_MASTER_ACTION_TYPES.OPEN_CREATE_POPUP, payload: { scope } }),
  openEditPopup: ({ scope, row }) => ({ type: SPEC_MASTER_ACTION_TYPES.OPEN_EDIT_POPUP, payload: { scope, row } }),
  hydratePopupForm: ({ scope, row }) => ({
    type: SPEC_MASTER_ACTION_TYPES.HYDRATE_POPUP_FORM,
    payload: { scope, row },
  }),
  closePopup: () => ({ type: SPEC_MASTER_ACTION_TYPES.CLOSE_POPUP }),
  setPopupField: ({ name, value }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SET_POPUP_FIELD,
    payload: { name, value },
  }),

  saveRequest: () => ({ type: SPEC_MASTER_ACTION_TYPES.SAVE_REQUEST }),
  saveSuccess: (message) => ({ type: SPEC_MASTER_ACTION_TYPES.SAVE_SUCCESS, payload: { message } }),
  saveFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.SAVE_FAILURE, payload: { error } }),

  deleteRequest: ({ scope, specId }) => ({ type: SPEC_MASTER_ACTION_TYPES.DELETE_REQUEST, payload: { scope, specId } }),
  deleteSuccess: (message) => ({ type: SPEC_MASTER_ACTION_TYPES.DELETE_SUCCESS, payload: { message } }),
  deleteFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.DELETE_FAILURE, payload: { error } }),
};

export default specMasterActions;
