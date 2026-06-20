import { initialSpecMasterState } from "./reducer";

// SpecMaster는 vc slice 아래에 붙는다. 아직 reducer가 등록되지 않은 테스트 환경에서도
// 화면이 터지지 않도록 initial state를 fallback으로 둔다.
export const selectSpecMasterState = (state) => state?.vc?.specMaster || initialSpecMasterState;

// SearchPanel이 쓰는 조회 조건과 콤보 후보.
export const selectSpecMasterSearch = (state) => selectSpecMasterState(state).search;
export const selectSpecMasterOptions = (state) => selectSpecMasterState(state).options;

// 좌측 Master Grid와 우측 Detail Grid row.
export const selectSpecMasterMasterRows = (state) => selectSpecMasterState(state).masterRows;
export const selectSpecMasterDetailRows = (state) => selectSpecMasterState(state).detailRows;

// radio 선택값. id만 저장하고 실제 row 객체는 아래 selector에서 다시 찾는다.
export const selectSpecMasterSelectedSpecId = (state) => selectSpecMasterState(state).selectedSpecId;
export const selectSpecMasterSelectedDetailSpecId = (state) => selectSpecMasterState(state).selectedDetailSpecId;

// 수정/삭제 버튼과 Detail 신규 팝업은 선택된 Master row 전체가 필요하다.
export const selectSpecMasterSelectedMaster = (state) => {
  const specMaster = selectSpecMasterState(state);
  return specMaster.masterRows.find((row) => row.specId === specMaster.selectedSpecId) || null;
};

// Detail 수정/삭제 버튼은 선택된 Detail row 전체가 필요하다.
export const selectSpecMasterSelectedDetail = (state) => {
  const specMaster = selectSpecMasterState(state);
  return specMaster.detailRows.find((row) => row.specId === specMaster.selectedDetailSpecId) || null;
};

// paging, popup, loading, message는 화면 표시 상태라 container에서 직접 읽는다.
export const selectSpecMasterPage = (state) => selectSpecMasterState(state).page;
export const selectSpecMasterPopup = (state) => selectSpecMasterState(state).popup;
export const selectSpecMasterLoading = (state) => selectSpecMasterState(state).loading;
export const selectSpecMasterError = (state) => selectSpecMasterState(state).error;
export const selectSpecMasterMessage = (state) => selectSpecMasterState(state).message;
