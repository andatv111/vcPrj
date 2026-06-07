/**
 * Reducer 파일: reducer.js
 * ------------------------------------------------------------
 * 역할
 * - BIM/5D미적용 Fab 화면의 상태(state)를 관리합니다.
 * - API 호출 자체는 하지 않고, action을 받아서 state만 변경합니다.
 *
 * 중요한 상태 구조
 * - search              : EQ ID, 공사번호 조회조건
 * - eqSuggestions       : EQ ID 자동완성 후보
 * - drawings            : 수기도면 조회 결과 첫 번째 그리드
 * - selectedDrawing     : 사용자가 선택한 수기도면 1건
 * - chambers            : 선택 수기도면 기준으로 생성된 Chamber 탭 목록
 * - activeChamberId     : 현재 선택된 Chamber 탭
 * - loading             : 조회/다운로드/산출 중 여부
 *
 * 설계 원칙
 * - B/E API 호출은 saga에서 처리하고 reducer는 순수하게 상태만 변경합니다.
 * - 배관 유형 변경 시 불필요 필드는 reducer에서 즉시 비워서 데이터 정합성을 맞춥니다.
 * - MDM/도면에서 기본 생성된 Chamber는 locked=true로 두어 삭제되지 않게 했습니다.
 */

import { NON_BIM_ACTION_TYPES } from "./action";
import {
  DEFAULT_LOADING,
  DEFAULT_SEARCH,
  PIPE_TYPE,
} from "../../../components/vc/nonBim/core/NonBim.constant";
import {
  applySpecToChamber,
  canAddChamber,
  createEmptyPipeRow,
  createUserChamber,
  normalizeChambersFromDrawing,
  normalizePipeRowByType,
  onlyNumberLike,
} from "../../../components/vc/nonBim/core/NonBim.helper";

const getSpecByValue = (options = [], value) =>
  options.find((option) => option.value === value || option.label === value) || null;

// Non-BIM 화면의 단일 데이터 모델입니다.
// 검색 조건, 도면 목록, 선택 도면, Chamber/배관 편집값, 계산 결과 팝업 상태를 모두 이 slice에서 관리합니다.
// 화면 전체 초기 state.
// 이 구조가 이 화면의 데이터 모델이라고 보면 된다.
export const initialNonBimState = {
  search: { ...DEFAULT_SEARCH },

  eqSuggestions: [],
  drawings: [],

  selectedDrawingId: "",
  selectedDrawing: null,

  chambers: [],
  activeChamberId: "",

  loading: { ...DEFAULT_LOADING },
  error: null,

};

// loading 상태를 간단히 변경하기 위한 보조 함수.
// key는 eqSuggestions/drawings/download/calculate 중 하나다.
const setLoading = (state, key, value) => ({
  ...state,
  loading: {
    ...state.loading,
    [key]: value,
  },
});

// 특정 Chamber 하나만 찾아 수정하기 위한 보조 함수.
// chamber 배열 전체를 직접 수정하지 않고 새 배열을 만들어 Redux 불변성을 지킨다.
const updateChamber = (state, chamberId, updater) => ({
  ...state,
  chambers: state.chambers.map((chamber) =>
    chamber.id === chamberId ? updater(chamber) : chamber
  ),
});

const updateActiveChamberIdAfterRemove = (chambers, currentActiveChamberId) => {
  // 삭제 후 현재 active id가 사라졌다면 첫 번째 Chamber로 포커스를 이동합니다.
  if (!chambers.length) return "";
  if (chambers.some((chamber) => chamber.id === currentActiveChamberId)) {
    return currentActiveChamberId;
  }
  return chambers[0].id;
};

const nonBimReducer = (state = initialNonBimState, action = {}) => {
  switch (action.type) {
    // 조회조건 입력 변경 처리.
    case NON_BIM_ACTION_TYPES.SET_SEARCH_FIELD: {
      const { name, value } = action.payload;

      return {
        ...state,
        search: {
          ...state.search,
          [name]: value,
        },
      };
    }

    case NON_BIM_ACTION_TYPES.RESET_SEARCH:
      return {
        ...state,
        search: { ...DEFAULT_SEARCH },
        eqSuggestions: [],
      };

    case NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST:
      return setLoading(state, "eqSuggestions", true);

    case NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_SUCCESS:
      return {
        ...setLoading(state, "eqSuggestions", false),
        eqSuggestions: action.payload.items || [],
        error: null,
      };

    case NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_FAILURE:
      return {
        ...setLoading(state, "eqSuggestions", false),
        eqSuggestions: [],
        error: action.payload.error,
      };

    // 수기도면 조회 시작.
// 이전 선택값과 Chamber를 초기화해서 새 조회 결과와 이전 편집 상태가 섞이지 않게 한다.
    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST:
      return {
        ...setLoading(state, "drawings", true),
        drawings: [],
        selectedDrawingId: "",
        selectedDrawing: null,
        chambers: [],
        activeChamberId: "",
      };

    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_SUCCESS:
      return {
        ...setLoading(state, "drawings", false),
        drawings: action.payload.items || [],
        error: null,
      };

    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_FAILURE:
      return {
        ...setLoading(state, "drawings", false),
        error: action.payload.error,
      };

    // 첫 번째 그리드에서 수기도면 1건 선택.
// 선택된 도면의 chamberCount/chambers를 기준으로 하단 Chamber 탭을 생성한다.
    case NON_BIM_ACTION_TYPES.SELECT_DRAWING: {
      const drawing = state.drawings.find((item) => item.id === action.payload.drawingId) || null;
      const chambers = drawing ? normalizeChambersFromDrawing(drawing) : [];

      return {
        ...state,
        selectedDrawingId: drawing?.id || "",
        selectedDrawing: drawing,
        chambers,
        activeChamberId: chambers[0]?.id || "",
      };
    }

    case NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_SUCCESS: {
      if (state.selectedDrawingId !== action.payload.drawingId) return state;

      // 도면 선택 후 받아온 Model Standard 목록을 선택 도면과 모든 Chamber에 반영합니다.
      // Chamber에 기존 선택값이 없으면 첫 번째 option을 기본값으로 사용합니다.
      const options = action.payload.options || [];
      const selectedDrawing = state.selectedDrawing
        ? {
            ...state.selectedDrawing,
            specOptions: options,
          }
        : state.selectedDrawing;

      return {
        ...state,
        selectedDrawing,
        chambers: state.chambers.map((chamber) => {
          const nextModelStandard = chamber.modelStandard || options[0]?.value || "";
          const spec = getSpecByValue(options, nextModelStandard);

          return {
            ...chamber,
            specOptions: options,
            modelStandard: nextModelStandard,
            minSpec: spec ? spec.minSpec : chamber.minSpec,
            maxSpec: spec ? spec.maxSpec : chamber.maxSpec,
          };
        }),
      };
    }

    case NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_FAILURE:
      return {
        ...state,
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST:
      return setLoading(state, "download", true);

    case NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_SUCCESS:
      return {
        ...setLoading(state, "download", false),
        error: null,
      };

    case NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_FAILURE:
      return {
        ...setLoading(state, "download", false),
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.SET_ACTIVE_CHAMBER:
      return {
        ...state,
        activeChamberId: action.payload.chamberId,
      };

    // Chamber Add 버튼 처리.
// 최대 개수 제한은 helper의 canAddChamber에서 판단한다.
    case NON_BIM_ACTION_TYPES.ADD_CHAMBER: {
      if (!canAddChamber(state.chambers)) return state;

      const chamber = createUserChamber(state.chambers, state.selectedDrawing);
      const chambers = [...state.chambers, chamber];

      return {
        ...state,
        chambers,
        activeChamberId: chamber.id,
      };
    }

    // Chamber 삭제 처리.
// MDM/도면에서 기본 생성된 locked Chamber는 삭제하지 않는다.
    case NON_BIM_ACTION_TYPES.REMOVE_CHAMBER: {
      const target = state.chambers.find((chamber) => chamber.id === action.payload.chamberId);
      if (!target || target.locked) return state;

      const chambers = state.chambers.filter((chamber) => chamber.id !== action.payload.chamberId);

      return {
        ...state,
        chambers,
        activeChamberId: updateActiveChamberIdAfterRemove(chambers, state.activeChamberId),
      };
    }

    // Chamber 상단 영역 변경 처리.
// 모델관리기준 선택 시 Min/Max 자동 세팅, Spec Skip 시 관련 값을 비운다.
    case NON_BIM_ACTION_TYPES.UPDATE_CHAMBER_FIELD: {
      const { chamberId, name, value } = action.payload;

      return updateChamber(state, chamberId, (chamber) => {
        if (name === "modelStandard") {
          return applySpecToChamber(chamber, value);
        }

        if (name === "isSpecSkipped") {
          return {
            ...chamber,
            isSpecSkipped: Boolean(value),
          };
        }

        if (name === "minSpec" || name === "maxSpec") {
          return {
            ...chamber,
            [name]: onlyNumberLike(value),
          };
        }

        return {
          ...chamber,
          [name]: value,
        };
      });
    }

    case NON_BIM_ACTION_TYPES.ADD_PIPE_ROW: {
      const chamberId = action.payload.chamberId || state.activeChamberId;

      return updateChamber(state, chamberId, (chamber) => ({
        ...chamber,
        pipeRows: [...chamber.pipeRows, createEmptyPipeRow(PIPE_TYPE.PIPE)],
      }));
    }

    case NON_BIM_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW: {
      const chamberId = action.payload.chamberId || state.activeChamberId;

      return updateChamber(state, chamberId, (chamber) => {
        // 마지막 배관 row는 삭제 대신 빈 row로 교체해 사용자가 다시 추가하지 않아도 바로 입력할 수 있게 합니다.
        if (!chamber.selectedPipeRowId) return chamber;
        if (chamber.pipeRows.length <= 1) {
          return {
            ...chamber,
            pipeRows: [createEmptyPipeRow(PIPE_TYPE.PIPE)],
            selectedPipeRowId: "",
          };
        }

        return {
          ...chamber,
          pipeRows: chamber.pipeRows.filter((row) => row.id !== chamber.selectedPipeRowId),
          selectedPipeRowId: "",
        };
      });
    }

    case NON_BIM_ACTION_TYPES.SELECT_PIPE_ROW: {
      const { chamberId, rowId } = action.payload;

      return updateChamber(state, chamberId, (chamber) => ({
        ...chamber,
        selectedPipeRowId: rowId,
      }));
    }

    // 배관정보 row 변경 처리.
// 유형 변경 시 normalizePipeRowByType으로 불필요 컬럼 값을 정리한다.
    case NON_BIM_ACTION_TYPES.UPDATE_PIPE_ROW: {
      const { chamberId, rowId, name, value } = action.payload;

      return updateChamber(state, chamberId, (chamber) => ({
        ...chamber,
        pipeRows: chamber.pipeRows.map((row) => {
          if (row.id !== rowId) return row;

          const nextRow = {
            ...row,
            [name]: name === "type" ? value : onlyNumberLike(value),
          };

          return normalizePipeRowByType(nextRow);
        }),
      }));
    }

    case NON_BIM_ACTION_TYPES.CALCULATE_REQUEST:
      return {
        ...setLoading(state, "calculate", true),
        error: null,
      };

    // 산출 API 성공.
// 결과 데이터 저장과 팝업 표시는 공용 vcResult slice가 담당하므로 여기서는 loading만 내린다.
    case NON_BIM_ACTION_TYPES.CALCULATE_SUCCESS:
      return {
        ...setLoading(state, "calculate", false),
      };

    case NON_BIM_ACTION_TYPES.CALCULATE_FAILURE:
      return {
        ...setLoading(state, "calculate", false),
        error: action.payload.error,
      };

    default:
      return state;
  }
};

export default nonBimReducer;
