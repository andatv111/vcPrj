import { findActiveChamber } from "../../../components/vc/nonBim/core/NonBim.helper";
import { initialVcCalculatorState } from "./reducer";

/**
 * 회사 코드 전환 메모
 *
 * Calculator selector도 회사 표준 selector 규칙으로 교체 가능합니다.
 * 화면 컴포넌트가 root reducer 경로를 직접 참조하지 않게 유지하는 것이 목적입니다.
 */

// 컴포넌트가 root state 구조를 직접 알지 않도록 계산기 state 접근을 selector에 모읍니다.
export const selectVcCalculatorState = (state) => state?.vc?.vcCalculator || initialVcCalculatorState;

export const selectVcCalculatorEquipment = (state) => selectVcCalculatorState(state).equipment;

export const selectVcCalculatorOptions = (state) => selectVcCalculatorState(state).options;

export const selectVcCalculatorChambers = (state) => selectVcCalculatorState(state).chambers;

export const selectVcCalculatorActiveChamber = (state) => {
  const current = selectVcCalculatorState(state);

  // activeChamberId가 비어 있거나 삭제된 경우에도 첫 Chamber를 fallback으로 반환합니다.
  return findActiveChamber(current.chambers, current.activeChamberId);
};

export const selectVcCalculatorLoading = (state) => selectVcCalculatorState(state).loading;

export const selectVcCalculatorError = (state) => selectVcCalculatorState(state).error;

export const selectCanSelectModelStandard = (state) => {
  const equipment = selectVcCalculatorEquipment(state);

  // Fab와 Model을 모두 선택한 뒤에만 Model Standard 선택을 허용합니다.
  return Boolean(equipment.fab && equipment.model);
};
