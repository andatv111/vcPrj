import { MAX_CHAMBER_COUNT, PIPE_TYPE } from "../../../components/vc/nonBim/core/NonBim.constant";
import {
  createEmptyPipeRow,
  createId,
  createUserChamber,
  normalizePipeRowByType,
  onlyNumberLike,
} from "../../../components/vc/nonBim/core/NonBim.helper";
import { VC_CALCULATOR_ACTION_TYPES } from "./action";

const createCalculatorChamber = (chambers = [], equipment = {}, modelStandardOptions = []) => {
  // Calculator는 도면 원본이 없으므로 Non-BIM helper의 사용자 추가 Chamber 생성 규칙을 재사용합니다.
  const chamber = createUserChamber(chambers, {
    fab: equipment.fab,
    model: equipment.model,
    processLarge: "Manual",
    processMiddle: "Calculator",
    specOptions: modelStandardOptions,
  });

  return {
    ...chamber,
    id: createId("CALC_CHAMBER"),
    locked: false,
    specOptions: modelStandardOptions,
  };
};

const firstChamber = createCalculatorChamber([], {}, []);

// 단독 계산기 화면의 초기 state입니다. 최소 1개 Chamber를 항상 유지해 바로 배관 입력이 가능합니다.
export const initialVcCalculatorState = {
  equipment: {
    fab: "",
    model: "",
    modelStandard: "",
    minSpec: "",
    maxSpec: "",
  },
  options: {
    fabs: [],
    models: [],
    modelStandards: [],
  },
  chambers: [firstChamber],
  activeChamberId: firstChamber.id,
  loading: {
    init: false,
    calculate: false,
  },
  error: null,
};

const updateChamber = (state, chamberId, updater) => ({
  // Redux 불변성을 지키기 위해 대상 Chamber만 새 객체로 교체합니다.
  ...state,
  chambers: state.chambers.map((chamber) =>
    chamber.id === chamberId ? updater(chamber) : chamber
  ),
});

const isEquipmentReadyForStandard = (equipment) => Boolean(equipment.fab && equipment.model);

const getSelectedSpec = (modelStandards, value) =>
  modelStandards.find((item) => item.value === value || item.label === value) || null;

const vcCalculatorReducer = (state = initialVcCalculatorState, action = {}) => {
  switch (action.type) {
    case VC_CALCULATOR_ACTION_TYPES.INIT_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          init: true,
        },
      };

    case VC_CALCULATOR_ACTION_TYPES.INIT_SUCCESS:
      return {
        ...state,
        loading: {
          ...state.loading,
          init: false,
        },
        options: action.payload.options,
      };

    case VC_CALCULATOR_ACTION_TYPES.INIT_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          init: false,
        },
        error: action.payload.error,
      };

    case VC_CALCULATOR_ACTION_TYPES.SET_EQUIPMENT_FIELD: {
      // Fab/Model 중 하나라도 비어 있으면 Model Standard와 Spec을 초기화해 잘못된 조합을 막습니다.
      const equipment = {
        ...state.equipment,
        [action.payload.name]: action.payload.value,
      };

      if (!isEquipmentReadyForStandard(equipment)) {
        equipment.modelStandard = "";
        equipment.minSpec = "";
        equipment.maxSpec = "";
      }

      return {
        ...state,
        equipment,
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.SET_MODEL_STANDARD: {
      // Model Standard를 고르면 연결된 Min/Max Spec을 장비 정보와 모든 Chamber에 반영합니다.
      const spec = getSelectedSpec(state.options.modelStandards, action.payload.value);

      return {
        ...state,
        equipment: {
          ...state.equipment,
          modelStandard: action.payload.value,
          minSpec: spec?.minSpec || "",
          maxSpec: spec?.maxSpec || "",
        },
    chambers: state.chambers.map((chamber) => ({
          ...chamber,
          modelStandard: action.payload.value,
          minSpec: spec?.minSpec || "",
          maxSpec: spec?.maxSpec || "",
          specOptions: state.options.modelStandards,
        })),
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.ADD_CHAMBER: {
      // Chamber는 업무 상한(MAX_CHAMBER_COUNT)을 넘지 않게 제한합니다.
      if (state.chambers.length >= MAX_CHAMBER_COUNT) return state;
      const chamber = createCalculatorChamber(state.chambers, state.equipment, state.options.modelStandards);

      return {
        ...state,
        chambers: [...state.chambers, chamber],
        activeChamberId: chamber.id,
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.REMOVE_CHAMBER: {
      if (state.chambers.length <= 1) return state;
      const chambers = state.chambers.filter((chamber) => chamber.id !== action.payload.chamberId);

      return {
        ...state,
        chambers,
        activeChamberId: chambers.some((chamber) => chamber.id === state.activeChamberId)
          ? state.activeChamberId
          : chambers[0]?.id || "",
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.SET_ACTIVE_CHAMBER:
      return {
        ...state,
        activeChamberId: action.payload.chamberId,
      };

    case VC_CALCULATOR_ACTION_TYPES.UPDATE_CHAMBER_FIELD:
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        [action.payload.name]: action.payload.value,
      }));

    case VC_CALCULATOR_ACTION_TYPES.ADD_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId || state.activeChamberId, (chamber) => ({
        ...chamber,
        pipeRows: [...chamber.pipeRows, createEmptyPipeRow(PIPE_TYPE.PIPE)],
      }));

    case VC_CALCULATOR_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId || state.activeChamberId, (chamber) => {
        // 마지막 row를 삭제할 때는 완전히 비우지 않고 새 빈 row 하나를 남겨 입력 흐름을 유지합니다.
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

    case VC_CALCULATOR_ACTION_TYPES.SELECT_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        selectedPipeRowId: action.payload.rowId,
      }));

    case VC_CALCULATOR_ACTION_TYPES.UPDATE_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        pipeRows: chamber.pipeRows.map((row) => {
          if (row.id !== action.payload.rowId) return row;

          // 유형별로 쓰지 않는 필드는 normalizePipeRowByType에서 즉시 정리됩니다.
          return normalizePipeRowByType({
            ...row,
            [action.payload.name]:
              action.payload.name === "type" ? action.payload.value : onlyNumberLike(action.payload.value),
          });
        }),
      }));

    case VC_CALCULATOR_ACTION_TYPES.CALCULATE_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          calculate: true,
        },
        error: null,
      };

    case VC_CALCULATOR_ACTION_TYPES.CALCULATE_SUCCESS:
      return {
        ...state,
        loading: {
          ...state.loading,
          calculate: false,
        },
      };

    case VC_CALCULATOR_ACTION_TYPES.CALCULATE_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          calculate: false,
        },
        error: action.payload.error,
      };

    default:
      return state;
  }
};

export default vcCalculatorReducer;
