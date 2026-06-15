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

// FAB/Pipe Type 등 B/E에서 조회한 화면 선택지입니다.
export const selectNonBimOptions = (state) => selectNonBimState(state).options;

// EQ ID datalist 후보입니다. 화면은 API 응답 원형이 아니라 { value, label, raw } 형태만 사용합니다.
export const selectEqSuggestions = (state) => selectNonBimState(state).eqSuggestions;

// Manual Drawing Results 첫 번째 그리드 row 목록입니다.
export const selectDrawings = (state) => selectNonBimState(state).drawings;

// 현재 선택된 수기 도면 전체 row입니다. Chamber 탭 구성과 계산 payload의 설비 메타에 사용합니다.
export const selectSelectedDrawing = (state) => selectNonBimState(state).selectedDrawing;

// 선택 row의 업무 키입니다. DB surrogate key가 아니라 woId 기준입니다.
export const selectSelectedWoId = (state) => selectNonBimState(state).selectedWoId;

// 선택 도면에서 만들어진 Chamber 탭 목록입니다. 원본 도면 Chamber와 사용자 추가 Chamber가 함께 들어갑니다.
export const selectChambers = (state) => selectNonBimState(state).chambers;

// 현재 열린 Chamber 탭 id입니다. 실제 편집 대상은 selectActiveChamber에서 fallback까지 포함해 계산합니다.
export const selectActiveChamberId = (state) => selectNonBimState(state).activeChamberId;

export const selectActiveChamber = (state) => {
  const current = selectNonBimState(state);

  // 삭제/재조회 타이밍에 activeChamberId가 유효하지 않아도 화면이 깨지지 않도록 첫 Chamber를 fallback으로 둡니다.
  return findActiveChamber(current.chambers, current.activeChamberId);
};

// eqSuggestions, drawings, download, calculate 등 화면 영역별 loading flag입니다.
export const selectLoading = (state) => selectNonBimState(state).loading;

// saga/API 실패 메시지는 이 selector로 모아 화면 error 영역에 표시합니다.
export const selectError = (state) => selectNonBimState(state).error;
