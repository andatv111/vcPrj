/**
 * Vacuum Conductance 결과 팝업 공통 selector입니다.
 * 결과 팝업은 Non-BIM, Calculator뿐 아니라 향후 Master/이력 화면에서도 재사용될 수 있습니다.
 */
import { JUDGE } from "../../../components/vc/nonBim/core/NonBim.constant";
import { initialVcResultState } from "./reducer";

export const selectVcResultState = (state) => state?.vc?.vcResult || initialVcResultState;

export const selectVcResultVisible = (state) => selectVcResultState(state).visible;

export const selectVcResultBasicInfo = (state) => selectVcResultState(state).basicInfo;

export const selectVcResultRows = (state) => selectVcResultState(state).rows;

export const selectVcResultLoading = (state) => selectVcResultState(state).loading;

export const selectVcResultError = (state) => selectVcResultState(state).error;

export const selectVcResultSavedInfo = (state) => selectVcResultState(state).savedInfo;

export const selectVcResultDraftPopup = (state) => selectVcResultState(state).draftPopup;

// Spec Out 안내와 표준 기안 첨부 필요 여부에 쓰는 조건입니다.
export const selectVcResultHasSpecOut = (state) =>
  selectVcResultRows(state).some((row) => row.judge === JUDGE.HIGH_OUT || row.judge === JUDGE.LOW_OUT);

// 산출대상 제외 또는 Spec 미적용 row가 있으면 성공 문구 대신 N/A 안내를 보여줍니다.
export const selectVcResultHasNaRows = (state) =>
  selectVcResultRows(state).some(
    (row) => row.judge === JUDGE.NA || row.calculationTarget === false || row.conductance === "N/A"
  );
