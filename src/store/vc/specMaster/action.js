export const SPEC_MASTER_ACTION_PREFIX = "vc/specMaster";

export const SPEC_MASTER_ACTION_TYPES = {
  INIT_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/INIT_REQUEST`,
  INIT_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/INIT_SUCCESS`,
  INIT_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/INIT_FAILURE`,

  SET_SEARCH_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_SEARCH_FIELD`,
  RESET_SEARCH: `${SPEC_MASTER_ACTION_PREFIX}/RESET_SEARCH`,

  SEARCH_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_REQUEST`,
  SEARCH_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_SUCCESS`,
  SEARCH_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_FAILURE`,

  CHANGE_PAGE: `${SPEC_MASTER_ACTION_PREFIX}/CHANGE_PAGE`,
  SELECT_MASTER: `${SPEC_MASTER_ACTION_PREFIX}/SELECT_MASTER`,
  SELECT_DETAIL: `${SPEC_MASTER_ACTION_PREFIX}/SELECT_DETAIL`,

  FETCH_DETAILS_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_DETAILS_REQUEST`,
  FETCH_DETAILS_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_DETAILS_SUCCESS`,
  FETCH_DETAILS_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/FETCH_DETAILS_FAILURE`,

  OPEN_CREATE_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/OPEN_CREATE_POPUP`,
  OPEN_EDIT_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/OPEN_EDIT_POPUP`,
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

  searchRequest: () => ({ type: SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST }),
  searchSuccess: ({ rows, page }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS,
    payload: { rows, page },
  }),
  searchFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.SEARCH_FAILURE, payload: { error } }),

  changePage: (page) => ({ type: SPEC_MASTER_ACTION_TYPES.CHANGE_PAGE, payload: { page } }),
  selectMaster: (specId) => ({ type: SPEC_MASTER_ACTION_TYPES.SELECT_MASTER, payload: { specId } }),
  selectDetail: (specId) => ({ type: SPEC_MASTER_ACTION_TYPES.SELECT_DETAIL, payload: { specId } }),

  fetchDetailsRequest: (specId) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_REQUEST,
    payload: { specId },
  }),
  fetchDetailsSuccess: ({ specId, rows }) => ({
    type: SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_SUCCESS,
    payload: { specId, rows },
  }),
  fetchDetailsFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_FAILURE, payload: { error } }),

  openCreatePopup: (scope) => ({ type: SPEC_MASTER_ACTION_TYPES.OPEN_CREATE_POPUP, payload: { scope } }),
  openEditPopup: ({ scope, row }) => ({ type: SPEC_MASTER_ACTION_TYPES.OPEN_EDIT_POPUP, payload: { scope, row } }),
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
