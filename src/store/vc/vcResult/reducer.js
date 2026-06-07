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
      return {
        ...state,
        loading: {
          ...state.loading,
          save: false,
        },
        error: action.payload.error,
      };

    case VC_RESULT_ACTION_TYPES.CLOSE_DRAFT_POPUP:
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
