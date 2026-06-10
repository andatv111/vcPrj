/**
 * Vacuum Conductance 결과 팝업 공통 selector입니다.
 * 결과 팝업은 Non-BIM, Calculator뿐 아니라 향후 Master/이력 화면에서도 재사용될 수 있습니다.
 */
import { JUDGE } from "../../../components/vc/nonBim/core/NonBim.constant";
import { initialVcResultState } from "./reducer";

export const selectVcResultState = (state) => state?.vc?.vcResult || initialVcResultState;

// 결과 팝업 표시 여부입니다. 계산 성공 saga가 openResultPopup을 dispatch하면 true가 됩니다.
export const selectVcResultVisible = (state) => selectVcResultState(state).visible;

// 팝업 상단 기본정보입니다. normalizeCalculationResult에서 공통 모델로 보정됩니다.
export const selectVcResultBasicInfo = (state) => selectVcResultState(state).basicInfo;

// 결과 테이블 row입니다. Non-BIM과 Calculator가 동일한 row 모델을 사용합니다.
export const selectVcResultRows = (state) => selectVcResultState(state).rows;

// 저장 API 진행 상태입니다. 계산 loading과 별도라 팝업 버튼만 잠급니다.
export const selectVcResultLoading = (state) => selectVcResultState(state).loading;

// 저장 실패 또는 결과 팝업 흐름의 error 메시지입니다.
export const selectVcResultError = (state) => selectVcResultState(state).error;

// 저장 성공 응답입니다. savedId, savedAt, nextStatus 같은 후속 처리 힌트를 담을 수 있습니다.
export const selectVcResultSavedInfo = (state) => selectVcResultState(state).savedInfo;

// Spec Out Non-BIM 결과 저장 전에 필요한 기안 첨부 입력 상태입니다.
export const selectVcResultDraftPopup = (state) => selectVcResultState(state).draftPopup;

// Spec Out 안내와 표준 기안 첨부 필요 여부에 쓰는 조건입니다.
export const selectVcResultHasSpecOut = (state) =>
  selectVcResultRows(state).some((row) => row.judge === JUDGE.HIGH_OUT || row.judge === JUDGE.LOW_OUT);

// 산출대상 제외 또는 Spec 미적용 row가 있으면 성공 문구 대신 N/A 안내를 보여줍니다.
export const selectVcResultHasNaRows = (state) =>
  selectVcResultRows(state).some(
    (row) => row.judge === JUDGE.NA || row.calculationTarget === false || row.conductance === "N/A"
  );
