/**
 * Selector 파일: vcSimSelector.js
 * ------------------------------------------------------------
 * 역할
 * - 화면 컴포넌트가 Redux state 구조를 직접 알지 않아도 되도록
 *   필요한 상태만 꺼내주는 함수들을 모아둔 파일입니다.
 *
 * 왜 필요한가?
 * - rootReducer 등록 위치가 나중에 바뀔 수 있습니다.
 *   예: state.vc.nonBim / state.nonBim / state.vcNonBim
 * - 컴포넌트에서 state.vc.nonBim.search처럼 직접 접근하면
 *   reducer 등록 구조가 바뀔 때 화면 파일을 모두 수정해야 합니다.
 * - selector를 쓰면 selectNonBimState 함수 한 곳만 수정하면 됩니다.
 */

import { initialNonBimState } from "./reducer";
import { findActiveChamber } from "../../../components/vc/nonBim/core/NonBim.helper";

/**
 * 회사 코드 전환 메모
 *
 * 이 selector 파일은 "반드시 vcSimSelector를 써야 한다"는 의미가 아닙니다.
 * 회사 프로젝트의 selector/useSelector 규칙이 있다면 그 규칙으로 바꾸면 됩니다.
 *
 * 다만 화면 컴포넌트가 state.vc.nonBim 같은 root reducer 경로를 직접 알지 않게 하는 원칙은 유지하세요.
 * root reducer 등록 경로가 확정되면 selectNonBimState의 fallback을 회사 표준 경로 하나로 정리하면 됩니다.
 */

// Non-BIM selector는 컴포넌트가 root reducer 등록 경로를 몰라도 되게 하는 접근 계층입니다.
/**
 * 프로젝트 root reducer 등록 방식이 확정되지 않은 상태를 고려한 selector.
 * 실제 등록 경로가 정해지면 selectNonBimState만 고치면 된다.
 */
// 이 함수가 reducer 등록 위치의 완충 역할을 한다.
// rootReducer 구조가 확정되면 이 함수만 실제 경로에 맞게 단순화해도 된다.
export const selectNonBimState = (state) => {
  return (
    state?.vc?.nonBim ||
    state?.nonBim ||
    state?.vcNonBim ||
    initialNonBimState
  );
};

export const selectSearch = (state) => selectNonBimState(state).search;

export const selectEqSuggestions = (state) => selectNonBimState(state).eqSuggestions;

export const selectDrawings = (state) => selectNonBimState(state).drawings;

export const selectSelectedDrawing = (state) => selectNonBimState(state).selectedDrawing;

export const selectSelectedDrawingId = (state) => selectNonBimState(state).selectedDrawingId;

export const selectChambers = (state) => selectNonBimState(state).chambers;

export const selectActiveChamberId = (state) => selectNonBimState(state).activeChamberId;

// 현재 선택된 Chamber 탭 객체를 반환한다.
// activeChamberId가 비어 있으면 첫 번째 Chamber를 fallback으로 사용한다.
export const selectActiveChamber = (state) => {
  const current = selectNonBimState(state);
  return findActiveChamber(current.chambers, current.activeChamberId);
};

export const selectLoading = (state) => selectNonBimState(state).loading;

export const selectError = (state) => selectNonBimState(state).error;
