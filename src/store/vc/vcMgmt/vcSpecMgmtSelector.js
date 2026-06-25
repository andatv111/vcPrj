import { initialSpecMasterState } from "./reducer";

// SpecMaster는 vc slice 아래에 붙는다. 테스트나 미등록 환경에서는 initial state를 fallback으로 쓴다.
export const selectSpecMgmtState = (state) => state?.vc?.specMaster || initialSpecMasterState;

// SearchPanel에서 사용하는 조회조건과 콤보 후보.
export const selectSpecMgmtSearch = (state) => selectSpecMgmtState(state).search;
export const selectSpecMgmtOptions = (state) => selectSpecMgmtState(state).options;
export const selectSpecMgmtSpecNameSuggestions = (state) => selectSpecMgmtState(state).specNameSuggestions;

// 좌측 Master Grid와 우측 Detail Grid row.
export const selectSpecMgmtMasterRows = (state) => selectSpecMgmtState(state).masterRows;
export const selectSpecMgmtDetailRows = (state) => selectSpecMgmtState(state).detailRows;

// radio 선택값은 id만 저장하고, 실제 row 객체는 selector에서 다시 찾는다.
export const selectSpecMgmtSelectedSpecId = (state) => selectSpecMgmtState(state).selectedSpecId;
export const selectSpecMgmtSelectedDetailSpecId = (state) => selectSpecMgmtState(state).selectedDetailSpecId;

// Detail 신규 팝업과 Master 수정/삭제 버튼에서 선택 Master 전체 row가 필요하다.
export const selectSpecMgmtSelectedMaster = (state) => {
  const specMaster = selectSpecMgmtState(state);
  return specMaster.masterRows.find((row) => row.specId === specMaster.selectedSpecId) || null;
};

// Detail 수정/삭제 버튼에서 선택 Detail 전체 row가 필요하다.
export const selectSpecMgmtSelectedDetail = (state) => {
  const specMaster = selectSpecMgmtState(state);
  return specMaster.detailRows.find((row) => row.specId === specMaster.selectedDetailSpecId) || null;
};

export const selectSpecMgmtPage = (state) => selectSpecMgmtState(state).page;
export const selectSpecMgmtPopup = (state) => selectSpecMgmtState(state).popup;
export const selectSpecMgmtLoading = (state) => selectSpecMgmtState(state).loading;
export const selectSpecMgmtError = (state) => selectSpecMgmtState(state).error;
export const selectSpecMgmtMessage = (state) => selectSpecMgmtState(state).message;
