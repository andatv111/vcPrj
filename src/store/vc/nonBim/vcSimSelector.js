/**
 * Non-BIM 화면 selector 모음입니다.
 * 컴포넌트가 root reducer 경로를 직접 알지 않도록 이 파일을 통해서만 화면 state를 읽습니다.
 */


import { initialNonBimState } from "./reducer";
import { findActiveChamber } from "../../../components/vc/nonBim/core/NonBim.helper";

// root reducer 등록 경로가 바뀌어도 이 함수 한 곳만 맞추면 화면 컴포넌트 영향이 줄어듭니다.
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

// 선택 row의 업무 키입니다. drawingId가 아니라 constructionNo 기준입니다.
export const selectSelectedConstructionNo = (state) => selectNonBimState(state).selectedConstructionNo;

export const selectChambers = (state) => selectNonBimState(state).chambers;

export const selectActiveChamberId = (state) => selectNonBimState(state).activeChamberId;

export const selectActiveChamber = (state) => {
  const current = selectNonBimState(state);
  return findActiveChamber(current.chambers, current.activeChamberId);
};

export const selectLoading = (state) => selectNonBimState(state).loading;

export const selectError = (state) => selectNonBimState(state).error;
