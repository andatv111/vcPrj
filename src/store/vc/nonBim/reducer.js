/**
 * BIM/5D 미적용 Fab 화면 state reducer입니다.
 * 이 화면은 계산용 화면이므로 저장/기안 상태를 상단 그리드에 영구 반영하지 않습니다.
 * 선택 row의 업무 PK는 selectedWoId이며 DB 도면 ID를 상태에 별도로 보관하지 않습니다.
 * Chamber 탭은 chamberCount/chambers 기준으로 구성합니다.
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
  normalizePipeRowByType,
  onlyNumberLike,
  resequenceChambers,
} from "../../../components/vc/nonBim/core/NonBim.helper";

const getSpecByValue = (options = [], value) =>
  options.find((option) => option.value === value || option.label === value) || null;

// Non-BIM 화면은 검색 조건, 조회 결과, 선택 도면, Chamber 탭, 로딩 상태를 한 slice에서 관리합니다.
// 계산 결과 팝업/저장 상태는 vcResult slice가 맡으므로 여기에는 편집 중인 입력 상태만 둡니다.
export const initialNonBimState = {
  search: { ...DEFAULT_SEARCH },

  options: {
    fabs: [],
    pipeTypes: [],
  },

  eqSuggestions: [],
  drawings: [],

  // 첫 번째 그리드 선택 상태는 WO ID 기준으로 관리합니다.
  selectedWoId: "",
  selectedDrawing: null,

  chambers: [],
  activeChamberId: "",

  loading: { ...DEFAULT_LOADING },
  error: null,

};

// loading key를 부분 갱신할 때 기존 loading 값을 보존하기 위한 공통 helper입니다.
const setLoading = (state, key, value) => ({
  ...state,
  loading: {
    ...state.loading,
    [key]: value,
  },
});

// Chamber 배열은 불변성을 유지해야 하므로 대상 Chamber만 새 객체로 교체합니다.
const updateChamber = (state, chamberId, updater) => ({
  ...state,
  chambers: state.chambers.map((chamber) =>
    chamber.id === chamberId ? updater(chamber) : chamber
  ),
});

const updateActiveChamberIdAfterRemove = (chambers, currentActiveChamberId) => {
  // 삭제한 Chamber가 현재 탭이면 첫 번째 남은 Chamber로 이동하고, 아니면 기존 탭을 유지합니다.
  if (!chambers.length) return "";
  if (chambers.some((chamber) => chamber.id === currentActiveChamberId)) {
    return currentActiveChamberId;
  }
  return chambers[0].id;
};

const nonBimReducer = (state = initialNonBimState, action = {}) => {
  switch (action.type) {
    case NON_BIM_ACTION_TYPES.INIT_OPTIONS_REQUEST:
      return setLoading(state, "options", true);

    case NON_BIM_ACTION_TYPES.INIT_OPTIONS_SUCCESS:
      return {
        ...setLoading(state, "options", false),
        options: action.payload.options || initialNonBimState.options,
        error: null,
      };

    case NON_BIM_ACTION_TYPES.INIT_OPTIONS_FAILURE:
      return {
        ...setLoading(state, "options", false),
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.SET_SEARCH_FIELD: {
      // 검색 input은 name/value 공통 payload로 들어오므로 DEFAULT_SEARCH key만 갱신합니다.
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
      // 조회 결과는 유지하고 검색 조건과 자동완성만 초기화합니다.
      return {
        ...state,
        search: { ...DEFAULT_SEARCH },
        eqSuggestions: [],
      };

    case NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST:
      // EQ ID 자동완성 요청 중에는 drawings loading과 독립적으로 표시합니다.
      return setLoading(state, "eqSuggestions", true);

    case NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_SUCCESS:
      // 자동완성 목록은 검색 조건과 별도로 보관해 datalist에 바로 연결합니다.
      return {
        ...setLoading(state, "eqSuggestions", false),
        eqSuggestions: action.payload.items || [],
        error: null,
      };

    case NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_FAILURE:
      // 실패 시 잘못된 후보가 남지 않도록 자동완성 목록을 비웁니다.
      return {
        ...setLoading(state, "eqSuggestions", false),
        eqSuggestions: [],
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST:
      // 새 검색을 시작하면 이전 선택 도면과 Chamber 탭을 함께 초기화해 stale 편집을 막습니다.
      return {
        ...setLoading(state, "drawings", true),
        drawings: [],
        selectedWoId: "",
        selectedDrawing: null,
        chambers: [],
        activeChamberId: "",
      };

    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_SUCCESS:
      // API/mock 응답은 saga에서 화면 모델로 normalize된 items를 전달합니다.
      return {
        ...setLoading(state, "drawings", false),
        drawings: action.payload.items || [],
        error: null,
      };

    case NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_FAILURE:
      // 조회 실패 시 기존 선택 상태는 이미 REQUEST에서 비워졌으므로 error만 기록합니다.
      return {
        ...setLoading(state, "drawings", false),
        error: action.payload.error,
      };
    case NON_BIM_ACTION_TYPES.SELECT_DRAWING: {
      // row 선택 후 Chamber 탭은 별도 B/E 조회 결과로 구성합니다.
      const drawing = state.drawings.find((item) => item.woId === action.payload.woId) || null;

      return {
        ...setLoading(state, "chambers", Boolean(drawing)),
        selectedWoId: drawing?.woId || "",
        selectedDrawing: drawing,
        chambers: [],
        activeChamberId: "",
        error: null,
      };
    }

    case NON_BIM_ACTION_TYPES.FETCH_DRAWING_CHAMBERS_SUCCESS: {
      // 늦게 도착한 이전 row 응답은 현재 선택된 WO ID와 다르면 무시합니다.
      if (state.selectedWoId !== action.payload.woId) return state;
      const chambers = action.payload.chambers || [];

      return {
        ...setLoading(state, "chambers", false),
        chambers,
        activeChamberId: chambers[0]?.id || "",
        error: null,
      };
    }

    case NON_BIM_ACTION_TYPES.FETCH_DRAWING_CHAMBERS_FAILURE:
      return {
        ...setLoading(state, "chambers", false),
        chambers: [],
        activeChamberId: "",
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_SUCCESS: {
      // Model Standard 옵션은 선택된 WO ID와 일치할 때만 반영해 늦게 도착한 응답이 화면을 덮지 않게 합니다.
      if (state.selectedWoId !== action.payload.woId) return state;

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
          const minSpec = spec ? spec.minSpec : chamber.minSpec;
          const maxSpec = spec ? spec.maxSpec : chamber.maxSpec;

          return {
            ...chamber,
            specOptions: options,
            modelStandard: nextModelStandard,
            minSpec,
            maxSpec,
            // 상세 Chamber에 이미 정상 Spec이 있으면 옵션 목록의 일부 누락 때문에 산출대상을 해제하지 않습니다.
            calculationTarget: Boolean(nextModelStandard && (minSpec || maxSpec)),
          };
        }),
      };
    }

    case NON_BIM_ACTION_TYPES.FETCH_MODEL_STANDARD_OPTIONS_FAILURE:
      // 옵션 조회 실패는 Chamber 입력을 강제로 지우지 않고 error만 노출합니다.
      return {
        ...state,
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST:
      // Foreline 다운로드는 선택/편집 상태와 무관한 별도 loading입니다.
      return setLoading(state, "download", true);

    case NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_SUCCESS:
      // 다운로드 성공 후 화면 데이터는 그대로 두고 loading만 종료합니다.
      return {
        ...setLoading(state, "download", false),
        error: null,
      };

    case NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_FAILURE:
      // 다운로드 실패도 도면 선택 상태를 유지해 사용자가 다시 시도할 수 있게 합니다.
      return {
        ...setLoading(state, "download", false),
        error: action.payload.error,
      };

    case NON_BIM_ACTION_TYPES.SET_ACTIVE_CHAMBER:
      // 탭 클릭은 activeChamberId만 바꿉니다. 실제 편집 대상은 selector가 이 id로 찾아줍니다.
      return {
        ...state,
        activeChamberId: action.payload.chamberId,
      };

    case NON_BIM_ACTION_TYPES.ADD_CHAMBER: {
      // 원본 도면 Chamber는 locked 상태로 유지하고, 추가 Chamber만 사용자가 삭제/수정할 수 있습니다.
      if (!canAddChamber(state.chambers)) return state;

      const chamber = createUserChamber(state.chambers, state.selectedDrawing);
      const chambers = resequenceChambers([...state.chambers, chamber]);

      return {
        ...state,
        chambers,
        activeChamberId: chamber.id,
      };
    }

    case NON_BIM_ACTION_TYPES.REMOVE_CHAMBER: {
      // locked Chamber는 도면 원본에서 온 탭이므로 삭제하지 않습니다.
      const target = state.chambers.find((chamber) => chamber.id === action.payload.chamberId);
      if (!target || target.locked) return state;

      const chambers = resequenceChambers(
        state.chambers.filter((chamber) => chamber.id !== action.payload.chamberId)
      );

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

        if (name === "calculationTarget") {
          // Spec이 없는 기준은 산출대상이 될 수 없으므로 스위치를 켜도 자동으로 false가 됩니다.
          return {
            ...chamber,
            calculationTarget: Boolean(value) && Boolean(chamber.modelStandard) && Boolean(chamber.minSpec || chamber.maxSpec),
          };
        }

        return {
          ...chamber,
          [name]: value,
        };
      });
    }

    case NON_BIM_ACTION_TYPES.ADD_PIPE_ROW: {
      // chamberId가 없으면 현재 활성 탭에 추가해 화면 버튼과 단축 호출을 모두 지원합니다.
      const chamberId = action.payload.chamberId || state.activeChamberId;

      return updateChamber(state, chamberId, (chamber) => ({
        ...chamber,
        pipeList: [...chamber.pipeList, createEmptyPipeRow(PIPE_TYPE.PIPE)],
      }));
    }

    case NON_BIM_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW: {
      // 배관 삭제는 row id를 직접 받지 않고, 탭별 selectedPipeRowId를 삭제 대상으로 사용합니다.
      const chamberId = action.payload.chamberId || state.activeChamberId;

      return updateChamber(state, chamberId, (chamber) => {
        if (!chamber.selectedPipeRowId) return chamber;
        if (chamber.pipeList.length <= 1) {
          // 마지막 row를 지울 때 표를 비우면 입력 UI가 사라지므로 빈 PIPE row 하나를 남깁니다.
          return {
            ...chamber,
            pipeList: [createEmptyPipeRow(PIPE_TYPE.PIPE)],
            selectedPipeRowId: "",
          };
        }

        return {
          ...chamber,
          pipeList: chamber.pipeList.filter((row) => row.id !== chamber.selectedPipeRowId),
          selectedPipeRowId: "",
        };
      });
    }

    case NON_BIM_ACTION_TYPES.SELECT_PIPE_ROW: {
      // pipe row radio는 삭제 대상 표시만 담당하고, row 값 자체는 바꾸지 않습니다.
      const { chamberId, rowId } = action.payload;

      return updateChamber(state, chamberId, (chamber) => ({
        ...chamber,
        selectedPipeRowId: rowId,
      }));
    }

    case NON_BIM_ACTION_TYPES.UPDATE_PIPE_ROW: {
      // 숫자형 입력은 reducer에서 정리하고, type 변경 시 사용하지 않는 컬럼 값을 즉시 비웁니다.
      const { chamberId, rowId, name, value } = action.payload;

      return updateChamber(state, chamberId, (chamber) => ({
        ...chamber,
        pipeList: chamber.pipeList.map((row) => {
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
      // 실제 검증/API 호출은 saga가 맡고, reducer는 버튼 중복 클릭 방지용 loading만 켭니다.
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
      // 계산 실패 시 편집값은 보존하고 error만 보여 다시 수정/재시도할 수 있게 합니다.
      return {
        ...setLoading(state, "calculate", false),
        error: action.payload.error,
      };

    default:
      return state;
  }
};

export default nonBimReducer;
