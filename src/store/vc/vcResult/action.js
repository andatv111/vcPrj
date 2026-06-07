export const VC_RESULT_ACTION_PREFIX = "vc/vcResult";

// 계산 결과 팝업은 Non-BIM과 Calculator가 함께 쓰므로 별도 slice로 분리했습니다.
// 열기/닫기, 저장 요청, Spec Out 기안 첨부 입력을 이 action set에서 관리합니다.
export const VC_RESULT_ACTION_TYPES = {
  OPEN_RESULT_POPUP: `${VC_RESULT_ACTION_PREFIX}/OPEN_RESULT_POPUP`,
  CLOSE_RESULT_POPUP: `${VC_RESULT_ACTION_PREFIX}/CLOSE_RESULT_POPUP`,
  SAVE_RESULT_REQUEST: `${VC_RESULT_ACTION_PREFIX}/SAVE_RESULT_REQUEST`,
  SAVE_RESULT_SUCCESS: `${VC_RESULT_ACTION_PREFIX}/SAVE_RESULT_SUCCESS`,
  SAVE_RESULT_FAILURE: `${VC_RESULT_ACTION_PREFIX}/SAVE_RESULT_FAILURE`,
  CLOSE_DRAFT_POPUP: `${VC_RESULT_ACTION_PREFIX}/CLOSE_DRAFT_POPUP`,
  SET_DRAFT_FIELD: `${VC_RESULT_ACTION_PREFIX}/SET_DRAFT_FIELD`,
};

export const vcResultActions = {
  // result payload는 helper에서 normalize된 표준 구조(basicInfo, rows, raw)를 기대합니다.
  // dispatch: Non-BIM 또는 Calculator 계산 saga 성공
  // reducer: 공용 결과 팝업을 열고 result rows/basicInfo를 저장합니다.
  openResultPopup: (result) => ({
    type: VC_RESULT_ACTION_TYPES.OPEN_RESULT_POPUP,
    payload: { result },
  }),

  // dispatch: 결과 팝업 Close/Cancel 버튼 click
  // reducer: 팝업만 닫고 rows/basicInfo는 유지합니다.
  closeResultPopup: () => ({
    type: VC_RESULT_ACTION_TYPES.CLOSE_RESULT_POPUP,
  }),

  // dispatch: 최종결과 저장 버튼 또는 기안 첨부 후 저장 버튼 click
  // reducer: Spec Out + Non-BIM + 기안정보 없음이면 draftPopup을 먼저 열고, 아니면 save loading 시작
  // saga: 실제 저장 API 호출은 reducer가 save loading을 시작한 뒤 saveResultFlow에서 처리합니다.
  saveResultRequest: () => ({
    type: VC_RESULT_ACTION_TYPES.SAVE_RESULT_REQUEST,
  }),

  // dispatch: saveResultFlow 성공
  // reducer: 저장 완료 정보(savedId 등)를 저장해 팝업 하단에 표시합니다.
  saveResultSuccess: (savedInfo) => ({
    type: VC_RESULT_ACTION_TYPES.SAVE_RESULT_SUCCESS,
    payload: { savedInfo },
  }),

  // dispatch: saveResultFlow 실패
  // reducer: save loading 종료와 error 표시를 처리합니다.
  saveResultFailure: (error) => ({
    type: VC_RESULT_ACTION_TYPES.SAVE_RESULT_FAILURE,
    payload: { error },
  }),

  // dispatch: 기안 첨부 팝업 Close/Cancel 버튼 click
  // reducer: 중첩 팝업만 닫고 입력한 title/attachment/comment는 유지합니다.
  closeDraftPopup: () => ({
    type: VC_RESULT_ACTION_TYPES.CLOSE_DRAFT_POPUP,
  }),

  // dispatch: 기안 첨부 팝업 input/textarea 변경
  // reducer: draftPopup[name]에 값을 저장합니다.
  setDraftField: ({ name, value }) => ({
    type: VC_RESULT_ACTION_TYPES.SET_DRAFT_FIELD,
    payload: { name, value },
  }),
};

export default vcResultActions;
