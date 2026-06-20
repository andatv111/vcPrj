import { findActiveChamber } from "../../../components/vc/nonBim/core/NonBim.helper";
import { initialVcCalculatorState } from "./reducer";

/**
 * V/C Calculator 화면 selector입니다.
 * 화면 컴포넌트는 reducer 구조를 직접 알지 않고, 이 파일의 selector를 통해 필요한 상태만 읽습니다.
 */

// Calculator slice의 기본 진입점입니다. store 연결 전 렌더링에서도 화면이 깨지지 않도록 초기 상태를 fallback으로 둡니다.
export const selectVcCalculatorState = (state) => state?.vc?.vcCalculator || initialVcCalculatorState;

// 상단 Search Conditions의 장비 선택값입니다. 계산 요청의 equipment 영역으로 변환됩니다.
export const selectVcCalculatorEquipment = (state) => selectVcCalculatorState(state).equipment;

// FAB, MODEL, Model Standard, Pipe Type option 목록입니다.
export const selectVcCalculatorOptions = (state) => selectVcCalculatorState(state).options;

// Calculator에서 사용자가 직접 구성하는 chamber tab 목록입니다.
export const selectVcCalculatorChambers = (state) => selectVcCalculatorState(state).chambers;

export const selectVcCalculatorActiveChamber = (state) => {
  const current = selectVcCalculatorState(state);

  // 선택 중인 chamber가 삭제되었거나 비어 있으면 첫 chamber로 보정해 편집 화면을 유지합니다.
  return findActiveChamber(current.chambers, current.activeChamberId);
};

export const selectVcCalculatorLoading = (state) => selectVcCalculatorState(state).loading;

// 옵션 조회 또는 계산 실패 메시지입니다.
export const selectVcCalculatorError = (state) => selectVcCalculatorState(state).error;

export const selectCanSelectModelStandard = (state) => {
  const equipment = selectVcCalculatorEquipment(state);

  // Model Standard는 FAB와 MODEL이 모두 선택된 뒤에만 선택할 수 있습니다.
  return Boolean(equipment.fab && equipment.model);
};
