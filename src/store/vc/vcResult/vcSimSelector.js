import { initialVcResultState } from "./reducer";

/**
 * 회사 코드 전환 메모
 *
 * 결과 팝업은 Non-BIM과 Calculator가 함께 쓰는 공용 state입니다.
 * 회사 selector 규칙으로 바꾸더라도 결과 팝업 컴포넌트가 root reducer 경로를 직접 알지 않게 유지하세요.
 */

// 결과 팝업은 여러 화면에서 재사용되므로 selector로 접근점을 고정합니다.
export const selectVcResultState = (state) => state?.vc?.vcResult || initialVcResultState;

export const selectVcResultVisible = (state) => selectVcResultState(state).visible;

export const selectVcResultBasicInfo = (state) => selectVcResultState(state).basicInfo;

export const selectVcResultRows = (state) => selectVcResultState(state).rows;

export const selectVcResultLoading = (state) => selectVcResultState(state).loading;

export const selectVcResultError = (state) => selectVcResultState(state).error;

export const selectVcResultSavedInfo = (state) => selectVcResultState(state).savedInfo;

export const selectVcResultDraftPopup = (state) => selectVcResultState(state).draftPopup;

export const selectVcResultHasSpecOut = (state) =>
  // 화면 경고 문구와 저장 전 기안 첨부 조건에서 동일하게 쓰는 Spec Out 여부입니다.
  selectVcResultRows(state).some((row) => row.judge === "HIGH_OUT" || row.judge === "LOW_OUT");
