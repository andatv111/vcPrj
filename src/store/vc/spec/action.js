export const SPEC_MASTER_ACTION_PREFIX = "vc/specMaster";

// Spec Master 화면의 콤보, grid, popup 저장 흐름을 한 slice에서 관리한다.
export const SPEC_MASTER_ACTION_TYPES = {
  // 화면 진입 시 콤보 API와 grid API를 순서대로 호출한다.
  INIT_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/INIT_REQUEST`,
  INIT_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/INIT_SUCCESS`,
  INIT_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/INIT_FAILURE`,

  // 상단 검색조건 콤보는 팝업 콤보와 분리해 각 API의 생명주기를 독립적으로 관리한다.
  SET_SEARCH_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_SEARCH_FIELD`,
  RESET_SEARCH: `${SPEC_MASTER_ACTION_PREFIX}/RESET_SEARCH`,
  FETCH_FAB_OPTIONS_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_FAB_OPTIONS_REQUEST`,
  FETCH_FAB_OPTIONS_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_FAB_OPTIONS_SUCCESS`,
  FETCH_FAB_OPTIONS_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_FAB_OPTIONS_FAILURE`,
  FETCH_MODEL_OPTIONS_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_MODEL_OPTIONS_REQUEST`,
  FETCH_MODEL_OPTIONS_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_MODEL_OPTIONS_SUCCESS`,
  FETCH_MODEL_OPTIONS_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_MODEL_OPTIONS_FAILURE`,
  CLEAR_MODEL_OPTIONS: `${SPEC_MASTER_ACTION_PREFIX}/CLEAR_MODEL_OPTIONS`,
  FETCH_SPEC_NAME_SUGGESTIONS_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_SPEC_NAME_SUGGESTIONS_REQUEST`,
  FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS`,
  FETCH_SPEC_NAME_SUGGESTIONS_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_SPEC_NAME_SUGGESTIONS_FAILURE`,
  CLEAR_SPEC_NAME_SUGGESTIONS: `${SPEC_MASTER_ACTION_PREFIX}/CLEAR_SPEC_NAME_SUGGESTIONS`,

  // 팝업 전용 콤보는 최초 진입 API에 포함하지 않고 팝업을 열 때 조회한다.
  FETCH_POPUP_OPTIONS_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_POPUP_OPTIONS_REQUEST`,
  FETCH_POPUP_OPTIONS_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_POPUP_OPTIONS_SUCCESS`,
  FETCH_POPUP_OPTIONS_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_POPUP_OPTIONS_FAILURE`,

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
  initSuccess: () => ({ type: SPEC_MASTER_ACTION_TYPES.INIT_SUCCESS }),
  initFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.INIT_FAILURE, payload: { error } }),

  setSearchField: ({ name, value }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SET_SEARCH_FIELD,
    payload: { name, value },
  }),
  resetSearch: () => ({ type: SPEC_MASTER_ACTION_TYPES.RESET_SEARCH }),
  fetchFabOptionsRequest: () => ({ type: SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_REQUEST }),
  fetchFabOptionsSuccess: (items) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_SUCCESS,
    payload: { items },
  }),
  fetchFabOptionsFailure: (error) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_FAILURE,
    payload: { error },
  }),
  fetchModelOptionsRequest: (fabId) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_REQUEST,
    payload: { fabId },
  }),
  fetchModelOptionsSuccess: ({ fabId, items }) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_SUCCESS,
    payload: { fabId, items },
  }),
  fetchModelOptionsFailure: ({ fabId, error }) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_FAILURE,
    payload: { fabId, error },
  }),
  clearModelOptions: () => ({ type: SPEC_MASTER_ACTION_TYPES.CLEAR_MODEL_OPTIONS }),
  fetchSpecNameSuggestionsRequest: ({ fabId, specNm } = {}) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_REQUEST,
    payload: { fabId, specNm },
  }),
  fetchSpecNameSuggestionsSuccess: ({ fabId, specNm, items }) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS,
    payload: { fabId, specNm, items },
  }),
  fetchSpecNameSuggestionsFailure: (error) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_FAILURE,
    payload: { error },
  }),
  clearSpecNameSuggestions: () => ({ type: SPEC_MASTER_ACTION_TYPES.CLEAR_SPEC_NAME_SUGGESTIONS }),

  fetchPopupOptionsRequest: () => ({ type: SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_REQUEST }),
  fetchPopupOptionsSuccess: (options) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_SUCCESS,
    payload: { options },
  }),
  fetchPopupOptionsFailure: (error) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_FAILURE,
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
