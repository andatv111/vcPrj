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

// 상단 장비 기본정보입니다. Fab/Model/Model Standard/Spec이 계산 payload의 equipment로 내려갑니다.
export const selectVcCalculatorEquipment = (state) => selectVcCalculatorState(state).equipment;

// Calculator 초기 select box 선택지입니다. getCalculatorOptions API 응답으로 채워집니다.
export const selectVcCalculatorOptions = (state) => selectVcCalculatorState(state).options;

// 도면 없이 수동으로 구성한 Chamber 탭 목록입니다.
export const selectVcCalculatorChambers = (state) => selectVcCalculatorState(state).chambers;

export const selectVcCalculatorActiveChamber = (state) => {
  const current = selectVcCalculatorState(state);

  // activeChamberId가 비어 있거나 삭제된 경우에도 첫 Chamber를 fallback으로 반환합니다.
  return findActiveChamber(current.chambers, current.activeChamberId);
};

export const selectVcCalculatorLoading = (state) => selectVcCalculatorState(state).loading;

// 초기 옵션 조회 또는 계산 실패 메시지를 화면 error 영역에 표시합니다.
export const selectVcCalculatorError = (state) => selectVcCalculatorState(state).error;

export const selectCanSelectModelStandard = (state) => {
  const equipment = selectVcCalculatorEquipment(state);

  // Fab와 Model을 모두 선택한 뒤에만 Model Standard 선택을 허용합니다.
  return Boolean(equipment.fab && equipment.model);
};
