export const SPEC_MASTER_ACTION_PREFIX = "vc/specMaster";

// SpecMaster 화면은 좌측 Master Grid와 우측 Detail Grid가 한 화면에서 같이 움직인다.
// action type은 화면 이벤트 이름이 아니라 "업무 흐름" 기준으로 나눠 saga/reducer가 같은 언어를 쓰게 한다.
export const SPEC_MASTER_ACTION_TYPES = {
  // 화면 진입 시 FAB/MODEL/공정 콤보 후보를 준비한다.
  INIT_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/INIT_REQUEST`,
  INIT_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/INIT_SUCCESS`,
  INIT_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/INIT_FAILURE`,

  // Search Conditions 영역의 입력값만 바꾼다. 실제 조회는 SEARCH_REQUEST가 담당한다.
  SET_SEARCH_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_SEARCH_FIELD`,
  RESET_SEARCH: `${SPEC_MASTER_ACTION_PREFIX}/RESET_SEARCH`,

  // 좌측 Master Grid 조회. 조회 성공 후 첫 Master의 Detail 조회는 saga에서 이어서 실행한다.
  SEARCH_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_REQUEST`,
  SEARCH_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_SUCCESS`,
  SEARCH_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/SEARCH_FAILURE`,

  // grid 선택 상태. Master 선택은 Detail Grid 조회 트리거이기도 하다.
  CHANGE_PAGE: `${SPEC_MASTER_ACTION_PREFIX}/CHANGE_PAGE`,
  SELECT_MASTER: `${SPEC_MASTER_ACTION_PREFIX}/SELECT_MASTER`,
  SELECT_DETAIL: `${SPEC_MASTER_ACTION_PREFIX}/SELECT_DETAIL`,
  DETAIL_REQUEST: `${SPEC_MASTER_ACTION_PREFIX}/DETAIL_REQUEST`,
  DETAIL_SUCCESS: `${SPEC_MASTER_ACTION_PREFIX}/DETAIL_SUCCESS`,
  DETAIL_FAILURE: `${SPEC_MASTER_ACTION_PREFIX}/DETAIL_FAILURE`,

  // 우측 Detail Grid 조회. 선택 Master의 specId를 upperCd 조건처럼 사용한다.

  // 등록/수정 팝업은 하나를 재사용하고 scope(master/detail)로 입력 항목을 다르게 보여준다.
  OPEN_CREATE_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/OPEN_CREATE_POPUP`,
  OPEN_EDIT_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/OPEN_EDIT_POPUP`,
  CLOSE_POPUP: `${SPEC_MASTER_ACTION_PREFIX}/CLOSE_POPUP`,
  SET_POPUP_FIELD: `${SPEC_MASTER_ACTION_PREFIX}/SET_POPUP_FIELD`,

  // 저장/삭제는 Master와 Detail이 같은 table row를 쓰므로 API는 공통이고 saga에서 scope만 분기한다.
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

  searchRequest: ({ selectedSpecId, selectedDetailSpecId } = {}) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST,
    payload: { selectedSpecId, selectedDetailSpecId },
  }),
  searchSuccess: ({ rows, details, page, selectedSpecId, selectedDetailSpecId }) => ({
    type: SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS,
    payload: { rows, details, page, selectedSpecId, selectedDetailSpecId },
  }),
  searchFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.SEARCH_FAILURE, payload: { error } }),

  changePage: (page) => ({ type: SPEC_MASTER_ACTION_TYPES.CHANGE_PAGE, payload: { page } }),
  selectMaster: (specId) => ({ type: SPEC_MASTER_ACTION_TYPES.SELECT_MASTER, payload: { specId } }),
  selectDetail: (specId) => ({ type: SPEC_MASTER_ACTION_TYPES.SELECT_DETAIL, payload: { specId } }),
  detailRequest: ({ specId, selectedDetailSpecId } = {}) => ({
    type: SPEC_MASTER_ACTION_TYPES.DETAIL_REQUEST,
    payload: { specId, selectedDetailSpecId },
  }),
  detailSuccess: ({ specId, details, selectedDetailSpecId }) => ({
    type: SPEC_MASTER_ACTION_TYPES.DETAIL_SUCCESS,
    payload: { specId, details, selectedDetailSpecId },
  }),
  detailFailure: (error) => ({ type: SPEC_MASTER_ACTION_TYPES.DETAIL_FAILURE, payload: { error } }),

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
