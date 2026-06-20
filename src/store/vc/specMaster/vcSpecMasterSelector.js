import { initialSpecMasterState } from "./reducer";

export const selectSpecMasterState = (state) => state?.vc?.specMaster || initialSpecMasterState;
export const selectSpecMasterSearch = (state) => selectSpecMasterState(state).search;
export const selectSpecMasterOptions = (state) => selectSpecMasterState(state).options;
export const selectSpecMasterMasterRows = (state) => selectSpecMasterState(state).masterRows;
export const selectSpecMasterDetailRows = (state) => selectSpecMasterState(state).detailRows;
export const selectSpecMasterSelectedSpecId = (state) => selectSpecMasterState(state).selectedSpecId;
export const selectSpecMasterSelectedDetailSpecId = (state) => selectSpecMasterState(state).selectedDetailSpecId;
export const selectSpecMasterSelectedMaster = (state) => {
  const specMaster = selectSpecMasterState(state);
  return specMaster.masterRows.find((row) => row.specId === specMaster.selectedSpecId) || null;
};
export const selectSpecMasterSelectedDetail = (state) => {
  const specMaster = selectSpecMasterState(state);
  return specMaster.detailRows.find((row) => row.specId === specMaster.selectedDetailSpecId) || null;
};
export const selectSpecMasterPage = (state) => selectSpecMasterState(state).page;
export const selectSpecMasterPopup = (state) => selectSpecMasterState(state).popup;
export const selectSpecMasterLoading = (state) => selectSpecMasterState(state).loading;
export const selectSpecMasterError = (state) => selectSpecMasterState(state).error;
export const selectSpecMasterMessage = (state) => selectSpecMasterState(state).message;
