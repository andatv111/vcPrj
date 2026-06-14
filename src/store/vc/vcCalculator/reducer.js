import { MAX_CHAMBER_COUNT, PIPE_TYPE } from "../../../components/vc/nonBim/core/NonBim.constant";
import {
  applySpecToChamber,
  createEmptyPipeRow,
  createId,
  createUserChamber,
  normalizePipeRowByType,
  onlyNumberLike,
  resequenceChambers,
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
    modelStandard: equipment.modelStandard || chamber.modelStandard,
    minSpec: equipment.minSpec || chamber.minSpec,
    maxSpec: equipment.maxSpec || chamber.maxSpec,
    calculationTarget: Boolean((equipment.modelStandard || chamber.modelStandard) && (equipment.minSpec || equipment.maxSpec || chamber.minSpec || chamber.maxSpec)),
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
    pipeTypes: [],
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

const getSelectedSpec = (modelStandards, value) =>
  modelStandards.find((item) => item.value === value || item.label === value) || null;

const vcCalculatorReducer = (state = initialVcCalculatorState, action = {}) => {
  switch (action.type) {
    case VC_CALCULATOR_ACTION_TYPES.INIT_REQUEST:
      // 화면 최초 진입 시 Fab/Model/Model Standard 선택지를 조회하는 동안 init loading을 켭니다.
      return {
        ...state,
        loading: {
          ...state.loading,
          init: true,
        },
      };

    case VC_CALCULATOR_ACTION_TYPES.INIT_SUCCESS:
      // saga가 내려준 선택지 목록을 그대로 options에 저장해 상단 select box와 연결합니다.
      return {
        ...state,
        loading: {
          ...state.loading,
          init: false,
        },
        options: action.payload.options,
      };

    case VC_CALCULATOR_ACTION_TYPES.INIT_FAILURE:
      // 초기 선택지 조회 실패 시 기존 입력값은 유지하고 error만 표시합니다.
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
        modelStandard: "",
        minSpec: "",
        maxSpec: "",
      };
      const defaultSpec = equipment.fab && equipment.model ? state.options.modelStandards[0] : null;

      if (defaultSpec) {
        equipment.modelStandard = defaultSpec.value;
        equipment.minSpec = defaultSpec.minSpec;
        equipment.maxSpec = defaultSpec.maxSpec;
      }

      return {
        ...state,
        equipment,
        chambers: state.chambers.map((chamber) =>
          defaultSpec
            ? applySpecToChamber({ ...chamber, specOptions: state.options.modelStandards }, defaultSpec.value)
            : {
                ...chamber,
                modelStandard: "",
                minSpec: "",
                maxSpec: "",
                specOptions: state.options.modelStandards,
                calculationTarget: false,
              }
        ),
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
        chambers: state.chambers.map((chamber) =>
          applySpecToChamber({ ...chamber, specOptions: state.options.modelStandards }, action.payload.value)
        ),
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.ADD_CHAMBER: {
      // Chamber는 업무 상한(MAX_CHAMBER_COUNT)을 넘지 않게 제한합니다.
      if (state.chambers.length >= MAX_CHAMBER_COUNT) return state;
      const chamber = createCalculatorChamber(state.chambers, state.equipment, state.options.modelStandards);
      const chambers = resequenceChambers([...state.chambers, chamber]);

      return {
        ...state,
        chambers,
        activeChamberId: chamber.id,
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.REMOVE_CHAMBER: {
      // Calculator는 도면 원본 탭이 없지만, 입력 시작점을 보장하기 위해 최소 1개 Chamber를 유지합니다.
      if (state.chambers.length <= 1) return state;
      const chambers = resequenceChambers(
        state.chambers.filter((chamber) => chamber.id !== action.payload.chamberId)
      );

      return {
        ...state,
        chambers,
        activeChamberId: chambers.some((chamber) => chamber.id === state.activeChamberId)
          ? state.activeChamberId
          : chambers[0]?.id || "",
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.SET_ACTIVE_CHAMBER:
      // 탭 클릭은 activeChamberId만 갱신합니다. selector가 이 id로 편집 대상 Chamber를 계산합니다.
      return {
        ...state,
        activeChamberId: action.payload.chamberId,
      };

    case VC_CALCULATOR_ACTION_TYPES.UPDATE_CHAMBER_FIELD:
      // 산출대상 checkbox는 Model Standard와 Spec이 있을 때만 true가 되도록 reducer에서 한 번 더 막습니다.
      return updateChamber(state, action.payload.chamberId, (chamber) => {
        if (action.payload.name === "modelStandard") {
          return applySpecToChamber({ ...chamber, specOptions: state.options.modelStandards }, action.payload.value);
        }

        return {
          ...chamber,
          [action.payload.name]:
            action.payload.name === "calculationTarget"
              ? Boolean(action.payload.value) && Boolean(chamber.modelStandard) && Boolean(chamber.minSpec || chamber.maxSpec)
              : action.payload.value,
        };
      });

    case VC_CALCULATOR_ACTION_TYPES.ADD_PIPE_ROW:
      // 현재 활성 Chamber 또는 명시된 Chamber에 기본 PIPE row를 추가합니다.
      return updateChamber(state, action.payload.chamberId || state.activeChamberId, (chamber) => ({
        ...chamber,
        pipeList: [...chamber.pipeList, createEmptyPipeRow(PIPE_TYPE.PIPE)],
      }));

    case VC_CALCULATOR_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId || state.activeChamberId, (chamber) => {
        // 마지막 row를 삭제할 때는 완전히 비우지 않고 새 빈 row 하나를 남겨 입력 흐름을 유지합니다.
        if (!chamber.selectedPipeRowId) return chamber;
        if (chamber.pipeList.length <= 1) {
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

    case VC_CALCULATOR_ACTION_TYPES.SELECT_PIPE_ROW:
      // pipe radio 선택값은 삭제 대상 추적용이며, 배관 값 자체는 변경하지 않습니다.
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        selectedPipeRowId: action.payload.rowId,
      }));

    case VC_CALCULATOR_ACTION_TYPES.UPDATE_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        pipeList: chamber.pipeList.map((row) => {
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
      // 실제 필수값 검증과 API 호출은 saga가 처리하고, reducer는 버튼 중복 클릭을 막는 loading만 켭니다.
      return {
        ...state,
        loading: {
          ...state.loading,
          calculate: true,
        },
        error: null,
      };

    case VC_CALCULATOR_ACTION_TYPES.CALCULATE_SUCCESS:
      // 계산 결과는 공용 vcResult slice가 보관하므로 Calculator slice는 loading만 종료합니다.
      return {
        ...state,
        loading: {
          ...state.loading,
          calculate: false,
        },
      };

    case VC_CALCULATOR_ACTION_TYPES.CALCULATE_FAILURE:
      // 실패 시 입력값을 그대로 유지해 사용자가 수정 후 재시도할 수 있게 합니다.
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
