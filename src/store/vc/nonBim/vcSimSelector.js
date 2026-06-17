/**
 * BIM/5D 미적용 Fab 화면 selector입니다.
 * 화면 컴포넌트는 root state 구조를 직접 참조하지 않고 이 파일을 통해 업무 상태를 읽습니다.
 */

import { initialNonBimState } from "./reducer";
import { findActiveChamber } from "../../../components/vc/nonBim/core/NonBim.helper";

// Non-BIM slice의 기본 진입점입니다. store 배치가 바뀌어도 selector만 맞추면 화면 코드는 유지됩니다.
export const selectNonBimState = (state) => {
  return (
    state?.vc?.nonBim ||
    state?.nonBim ||
    state?.vcNonBim ||
    initialNonBimState
  );
};

export const selectSearch = (state) => selectNonBimState(state).search;

// FAB, Pipe Type 등 화면 option 목록입니다.
export const selectNonBimOptions = (state) => selectNonBimState(state).options;

// EQ ID datalist 후보입니다. 화면은 { value, label, raw } 형태만 사용합니다.
export const selectEqSuggestions = (state) => selectNonBimState(state).eqSuggestions;

// Manual Drawing Results grid row 목록입니다.
export const selectDrawings = (state) => selectNonBimState(state).drawings;

// 현재 선택된 수기 도면 row입니다. chamber 구성과 계산 payload의 장비 context로 사용됩니다.
export const selectSelectedDrawing = (state) => selectNonBimState(state).selectedDrawing;

// 선택 row의 업무 key입니다. DB surrogate key가 아니라 woId 기준으로 관리합니다.
export const selectSelectedWoId = (state) => selectNonBimState(state).selectedWoId;

// 선택 도면에서 구성된 chamber 목록입니다. B/E 원본 chamber와 사용자 추가 chamber가 함께 들어갑니다.
export const selectChambers = (state) => selectNonBimState(state).chambers;

// 현재 편집 중인 chamber id입니다. 실제 chamber 객체 조회는 selectActiveChamber에서 fallback까지 처리합니다.
export const selectActiveChamberId = (state) => selectNonBimState(state).activeChamberId;

export const selectActiveChamber = (state) => {
  const current = selectNonBimState(state);

  // 선택 중인 chamber가 더 이상 없으면 첫 chamber로 보정해 화면 편집 흐름을 유지합니다.
  return findActiveChamber(current.chambers, current.activeChamberId);
};

// option, drawing, chamber, download, calculate 영역별 loading flag입니다.
export const selectLoading = (state) => selectNonBimState(state).loading;

// saga/API 실패 메시지입니다.
export const selectError = (state) => selectNonBimState(state).error;
