/**
 * BIM/5D 미적용 Fab 화면 state reducer입니다.
 * 이 화면은 계산용 화면이므로 저장/기안 상태를 상단 그리드에 영구 반영하지 않습니다.
 * 선택 row의 업무 PK는 selectedConstructionNo이며 Chamber 탭은 chamberCount/chambers 기준으로 구성합니다.
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

export const initialNonBimState = {
  search: { ...DEFAULT_SEARCH },

  eqSuggestions: [],
  drawings: [],

  // 첫 번째 그리드 선택 상태는 공사번호 기준으로 관리합니다.
  selectedConstructionNo: "",
  selectedDrawing: null,

  chambers: [],
  activeChamberId: "",

  loading: { ...DEFAULT_LOADING },
  error: null,

};

const setLoading = (state, key, value) => ({
  ...state,
  loading: {
    ...state.loading,
    [key]: value,
  },
});

const updateChamber = (state, chamberId, updater) => ({
  ...state,
  chambers: state.chambers.map((chamber) =>
    chamber.id === chamberId ? updater(chamber) : chamber
  ),
});

const updateActiveChamberIdAfterRemove = (chambers, currentActiveChamberId) => {
  if (!chambers.length) return "";
  if (chambers.some((chamber) => chamber.id === currentActiveChamberId)) {
    return currentActiveChamberId;
  }
  return chambers[0].id;
};

const nonBimReducer = (state = initialNonBimState, action = {}) => {
  switch (action.type) {
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

    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST:
      return {
        ...setLoading(state, "drawings", true),
        drawings: [],
        selectedConstructionNo: "",
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
    case NON_BIM_ACTION_TYPES.SELECT_DRAWING: {
      // 공사번호로 row를 찾고, 해당 row의 chamberCount/chambers로 하단 탭을 다시 만듭니다.
      const drawing = state.drawings.find((item) => item.constructionNo === action.payload.constructionNo) || null;
      const chambers = drawing ? normalizeChambersFromDrawing(drawing) : [];

      return {
        ...state,
        selectedConstructionNo: drawing?.constructionNo || "",
        selectedDrawing: drawing,
        chambers,
        activeChamberId: chambers[0]?.id || "",
      };
    }

    case NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_SUCCESS: {
      // Model Standard 옵션은 선택된 공사번호와 일치할 때만 반영해 늦게 도착한 응답이 화면을 덮지 않게 합니다.
      if (state.selectedConstructionNo !== action.payload.constructionNo) return state;

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
            calculateEnabled: Boolean(spec && nextModelStandard && (spec.minSpec || spec.maxSpec)),
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

    case NON_BIM_ACTION_TYPES.UPDATE_CHAMBER_FIELD: {
      const { chamberId, name, value } = action.payload;

      return updateChamber(state, chamberId, (chamber) => {
        if (name === "modelStandard") {
          // Model Standard 변경 시 Min/Max Spec은 옵션 데이터로만 세팅하고 직접 입력값은 받지 않습니다.
          return applySpecToChamber(chamber, value);
        }

        if (name === "isSpecSkipped") {
          return {
            ...chamber,
            isSpecSkipped: Boolean(value),
          };
        }

        if (name === "calculateEnabled") {
          // Spec이 없는 기준은 산출대상이 될 수 없으므로 스위치를 켜도 자동으로 false가 됩니다.
          return {
            ...chamber,
            calculateEnabled: Boolean(value) && Boolean(chamber.modelStandard) && Boolean(chamber.minSpec || chamber.maxSpec),
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

    case NON_BIM_ACTION_TYPES.CALCULATE_SUCCESS:
      // 계산 결과 데이터는 공통 vcResult slice가 보유하므로 여기서는 loading만 종료합니다.
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
