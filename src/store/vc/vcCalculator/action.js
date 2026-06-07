export const VC_CALCULATOR_ACTION_PREFIX = "vc/vcCalculator";

// V/C Calculator 화면에서 발생하는 사용자 입력, 초기 옵션 로드, 계산 요청을 구분하는 action type입니다.
// 문자열 prefix를 기능 단위로 고정해 다른 reducer/saga action과 충돌하지 않게 합니다.
export const VC_CALCULATOR_ACTION_TYPES = {
  INIT_REQUEST: `${VC_CALCULATOR_ACTION_PREFIX}/INIT_REQUEST`,
  INIT_SUCCESS: `${VC_CALCULATOR_ACTION_PREFIX}/INIT_SUCCESS`,
  INIT_FAILURE: `${VC_CALCULATOR_ACTION_PREFIX}/INIT_FAILURE`,
  SET_EQUIPMENT_FIELD: `${VC_CALCULATOR_ACTION_PREFIX}/SET_EQUIPMENT_FIELD`,
  SET_MODEL_STANDARD: `${VC_CALCULATOR_ACTION_PREFIX}/SET_MODEL_STANDARD`,
  ADD_CHAMBER: `${VC_CALCULATOR_ACTION_PREFIX}/ADD_CHAMBER`,
  REMOVE_CHAMBER: `${VC_CALCULATOR_ACTION_PREFIX}/REMOVE_CHAMBER`,
  SET_ACTIVE_CHAMBER: `${VC_CALCULATOR_ACTION_PREFIX}/SET_ACTIVE_CHAMBER`,
  UPDATE_CHAMBER_FIELD: `${VC_CALCULATOR_ACTION_PREFIX}/UPDATE_CHAMBER_FIELD`,
  ADD_PIPE_ROW: `${VC_CALCULATOR_ACTION_PREFIX}/ADD_PIPE_ROW`,
  REMOVE_SELECTED_PIPE_ROW: `${VC_CALCULATOR_ACTION_PREFIX}/REMOVE_SELECTED_PIPE_ROW`,
  SELECT_PIPE_ROW: `${VC_CALCULATOR_ACTION_PREFIX}/SELECT_PIPE_ROW`,
  UPDATE_PIPE_ROW: `${VC_CALCULATOR_ACTION_PREFIX}/UPDATE_PIPE_ROW`,
  CALCULATE_REQUEST: `${VC_CALCULATOR_ACTION_PREFIX}/CALCULATE_REQUEST`,
  CALCULATE_SUCCESS: `${VC_CALCULATOR_ACTION_PREFIX}/CALCULATE_SUCCESS`,
  CALCULATE_FAILURE: `${VC_CALCULATOR_ACTION_PREFIX}/CALCULATE_FAILURE`,
};

export const vcCalculatorActions = {
  // 화면 컴포넌트는 아래 creator만 호출하고, payload 구조는 이 파일에서 통일합니다.
  // dispatch: Calculator 화면 최초 mount
  // saga: Fab/Model/Model Standard 선택지 조회
  initRequest: () => ({ type: VC_CALCULATOR_ACTION_TYPES.INIT_REQUEST }),

  // dispatch: calculatorInitFlow 성공
  // reducer: options 목록을 저장해 select box에 표시합니다.
  initSuccess: (options) => ({
    type: VC_CALCULATOR_ACTION_TYPES.INIT_SUCCESS,
    payload: { options },
  }),
  // dispatch: calculatorInitFlow 실패
  // reducer: init loading 종료와 error 표시를 처리합니다.
  initFailure: (error) => ({
    type: VC_CALCULATOR_ACTION_TYPES.INIT_FAILURE,
    payload: { error },
  }),
  // dispatch: Fab 또는 Model select 변경
  // reducer: equipment[name] 갱신. Fab/Model 조합이 부족하면 Model Standard와 Spec을 초기화합니다.
  setEquipmentField: ({ name, value }) => ({
    type: VC_CALCULATOR_ACTION_TYPES.SET_EQUIPMENT_FIELD,
    payload: { name, value },
  }),
  // dispatch: Model Standard select 변경
  // reducer: 선택된 기준의 Min/Max Spec을 장비와 모든 Chamber에 반영합니다.
  setModelStandard: (value) => ({
    type: VC_CALCULATOR_ACTION_TYPES.SET_MODEL_STANDARD,
    payload: { value },
  }),
  // dispatch: Add Chamber 버튼 click
  // reducer: 최대 Chamber 수 이내에서 새 수동 Chamber를 추가합니다.
  addChamber: () => ({ type: VC_CALCULATOR_ACTION_TYPES.ADD_CHAMBER }),

  // dispatch: Chamber 삭제 버튼 click
  // reducer: 최소 1개 Chamber는 유지하고 activeChamberId를 보정합니다.
  removeChamber: (chamberId) => ({
    type: VC_CALCULATOR_ACTION_TYPES.REMOVE_CHAMBER,
    payload: { chamberId },
  }),
  // dispatch: Chamber tab click
  // reducer: activeChamberId만 변경합니다.
  setActiveChamber: (chamberId) => ({
    type: VC_CALCULATOR_ACTION_TYPES.SET_ACTIVE_CHAMBER,
    payload: { chamberId },
  }),
  // dispatch: Chamber 이름 등 단일 필드 변경
  // reducer: 대상 Chamber의 name key만 갱신합니다.
  updateChamberField: ({ chamberId, name, value }) => ({
    type: VC_CALCULATOR_ACTION_TYPES.UPDATE_CHAMBER_FIELD,
    payload: { chamberId, name, value },
  }),
  // dispatch: Add Pipe 버튼 click
  // reducer: 대상 Chamber에 기본 PIPE row를 추가합니다.
  addPipeRow: (chamberId) => ({
    type: VC_CALCULATOR_ACTION_TYPES.ADD_PIPE_ROW,
    payload: { chamberId },
  }),
  // dispatch: Remove Pipe 버튼 click
  // reducer: selectedPipeRowId row 삭제. 마지막 row면 빈 row 하나를 유지합니다.
  removeSelectedPipeRow: (chamberId) => ({
    type: VC_CALCULATOR_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW,
    payload: { chamberId },
  }),
  // dispatch: Pipe row radio 선택
  // reducer: 삭제 대상으로 사용할 selectedPipeRowId를 저장합니다.
  selectPipeRow: ({ chamberId, rowId }) => ({
    type: VC_CALCULATOR_ACTION_TYPES.SELECT_PIPE_ROW,
    payload: { chamberId, rowId },
  }),
  // dispatch: Pipe type/input 변경
  // reducer: 숫자형 입력 정리와 type별 row normalize를 수행합니다.
  updatePipeRow: ({ chamberId, rowId, name, value }) => ({
    type: VC_CALCULATOR_ACTION_TYPES.UPDATE_PIPE_ROW,
    payload: { chamberId, rowId, name, value },
  }),
  // dispatch: Calculator Calculate 버튼 click
  // saga: Chamber/배관 필수값 검증, payload 생성, 계산 API 호출, 공용 결과 팝업 open
  calculateRequest: () => ({ type: VC_CALCULATOR_ACTION_TYPES.CALCULATE_REQUEST }),

  // dispatch: vcCalculatorCalculateFlow 성공
  // reducer: loading.calculate만 종료합니다. 결과 데이터는 vcResult slice가 담당합니다.
  calculateSuccess: () => ({ type: VC_CALCULATOR_ACTION_TYPES.CALCULATE_SUCCESS }),

  // dispatch: vcCalculatorCalculateFlow 실패
  // reducer: loading.calculate 종료와 error 표시를 처리합니다.
  calculateFailure: (error) => ({
    type: VC_CALCULATOR_ACTION_TYPES.CALCULATE_FAILURE,
    payload: { error },
  }),
};

export default vcCalculatorActions;
