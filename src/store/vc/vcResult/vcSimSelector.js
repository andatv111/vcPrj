/**
 * Vacuum Conductance 결과 팝업 selector입니다.
 * Non-BIM과 Calculator 계산 결과를 같은 팝업 모델로 다루기 위해 공통 selector를 제공합니다.
 */
import { JUDGE } from "../../../components/vc/nonBim/core/NonBim.constant";
import { initialVcResultState } from "./reducer";

export const selectVcResultState = (state) => state?.vc?.vcResult || initialVcResultState;

// 결과 팝업 표시 여부입니다.
export const selectVcResultVisible = (state) => selectVcResultState(state).visible;

// 결과 팝업 상단 기본정보입니다.
export const selectVcResultBasicInfo = (state) => selectVcResultState(state).basicInfo;

// 결과 table row 목록입니다. Non-BIM과 Calculator가 같은 row 모델을 사용합니다.
export const selectVcResultRows = (state) => selectVcResultState(state).rows;

// 결과 저장 API 진행 상태입니다.
export const selectVcResultLoading = (state) => selectVcResultState(state).loading;

// 결과 팝업 또는 저장 flow에서 발생한 오류 메시지입니다.
export const selectVcResultError = (state) => selectVcResultState(state).error;

// 저장 성공 후 후속 처리에 필요한 savedId, savedAt, nextStatus 정보입니다.
export const selectVcResultSavedInfo = (state) => selectVcResultState(state).savedInfo;

// Non-BIM Spec Out 저장 전 입력받는 기안 첨부 정보입니다.
export const selectVcResultDraftPopup = (state) => selectVcResultState(state).draftPopup;

// 결과 중 Spec Out 판정이 있는지 여부입니다.
export const selectVcResultHasSpecOut = (state) =>
  selectVcResultRows(state).some((row) => row.judge === JUDGE.HIGH_OUT || row.judge === JUDGE.LOW_OUT);

// 계산 제외 또는 spec 미적용 row가 있는지 여부입니다.
export const selectVcResultHasNaRows = (state) =>
  selectVcResultRows(state).some(
    (row) => row.judge === JUDGE.NA || row.calculationTarget === false || row.conductance === "N/A"
  );
