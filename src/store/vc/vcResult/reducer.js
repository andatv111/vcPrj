import { VC_RESULT_ACTION_TYPES } from "./action";

// 공용 결과 팝업 state입니다. 계산 출처(sourceType)에 따라 저장 전 검증 방식이 달라집니다.
export const initialVcResultState = {
  visible: false,
  sourceType: "",
  basicInfo: null,
  rows: [],
  raw: null,
  loading: {
    save: false,
  },
  error: null,
  savedInfo: null,
  draftPopup: {
    visible: false,
    title: "",
    attachmentName: "",
    comment: "",
  },
};

const hasSpecOut = (rows = []) =>
  rows.some((row) => row.judge === "HIGH_OUT" || row.judge === "LOW_OUT");

// Non-BIM 저장 정책: Spec Out 결과는 표준 기안 첨부 정보가 있어야 최종 저장으로 넘어갑니다.
const needsDraftAttachment = (state) =>
  hasSpecOut(state.rows) &&
  state.sourceType === "NON_BIM" &&
  (!state.draftPopup.title.trim() || !state.draftPopup.attachmentName.trim());

const vcResultReducer = (state = initialVcResultState, action = {}) => {
  switch (action.type) {
    case VC_RESULT_ACTION_TYPES.OPEN_RESULT_POPUP: {
      // 새 계산 결과를 열 때 이전 저장 정보와 기안 첨부 입력값을 초기화합니다.
      const result = action.payload.result || {};

      return {
        ...state,
        visible: true,
        sourceType: result.sourceType || "",
        basicInfo: result.basicInfo || null,
        rows: result.rows || [],
        raw: result.raw || null,
        error: null,
        savedInfo: null,
        draftPopup: {
          ...initialVcResultState.draftPopup,
          visible: false,
        },
      };
    }

    case VC_RESULT_ACTION_TYPES.CLOSE_RESULT_POPUP:
      // 닫기/취소는 화면만 숨깁니다. rows/basicInfo를 남겨 두면 재오픈/디버깅 시 마지막 결과를 확인하기 쉽습니다.
      return {
        ...state,
        visible: false,
        error: null,
      };

    case VC_RESULT_ACTION_TYPES.SAVE_RESULT_REQUEST:
      // Non-BIM 결과에 Spec Out이 있으면 최종 저장 전에 기안 첨부 정보를 먼저 받습니다.
      // Calculator 결과는 단독 검토용이므로 동일 조건을 강제하지 않습니다.
      if (needsDraftAttachment(state)) {
        return {
          ...state,
          draftPopup: {
            ...state.draftPopup,
            visible: true,
          },
        };
      }

      return {
        ...state,
        loading: {
          ...state.loading,
          save: true,
        },
        error: null,
      };

    case VC_RESULT_ACTION_TYPES.SAVE_RESULT_SUCCESS:
      // 저장 성공 후 결과 팝업과 기안 첨부 팝업을 모두 닫고, 저장 응답은 savedInfo로 보관합니다.
      return {
        ...state,
        visible: false,
        loading: {
          ...state.loading,
          save: false,
        },
        draftPopup: {
          ...initialVcResultState.draftPopup,
          visible: false,
        },
        savedInfo: action.payload.savedInfo,
        error: null,
      };

    case VC_RESULT_ACTION_TYPES.SAVE_RESULT_FAILURE:
      // 저장 실패 시 팝업은 유지해 사용자가 기안 정보 또는 입력값을 보정해 다시 저장할 수 있게 합니다.
      return {
        ...state,
        loading: {
          ...state.loading,
          save: false,
        },
        error: action.payload.error,
      };

    case VC_RESULT_ACTION_TYPES.CLOSE_DRAFT_POPUP:
      // 중첩 팝업만 닫고 입력값은 유지합니다. 사용자가 다시 저장을 누르면 기존 입력을 이어서 볼 수 있습니다.
      return {
        ...state,
        draftPopup: {
          ...state.draftPopup,
          visible: false,
        },
      };

    case VC_RESULT_ACTION_TYPES.SET_DRAFT_FIELD:
      // 기안 첨부 팝업의 입력 필드는 name/value payload로 공통 처리합니다.
      return {
        ...state,
        draftPopup: {
          ...state.draftPopup,
          [action.payload.name]: action.payload.value,
        },
      };

    default:
      return state;
  }
};

export default vcResultReducer;
