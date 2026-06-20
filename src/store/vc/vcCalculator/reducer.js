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

const getSelectedSpec = (modelStandards, value) =>
  modelStandards.find((item) => item.value === value || item.label === value) || null;

// Calculator option lists are filtered by the selected FAB and equipment model only.
// The selected model standard itself remains chamber-local after the first default sync.
const getApplicableSpecs = (modelStandards = [], equipment = {}) =>
  modelStandards.filter(
    (item) =>
      (!item.fab || item.fab === equipment.fab) &&
      (!item.model || item.model === equipment.model)
  );

const createCalculatorChamber = (chambers = [], equipment = {}, specOptions = []) => {
  const chamber = createUserChamber(chambers, {
    fab: equipment.fab,
    model: equipment.model,
    processLarge: "Manual",
    processMiddle: "Calculator",
    specOptions,
  });

  return {
    ...chamber,
    id: createId("CALC_CHAMBER"),
    locked: false,
    specOptions,
    modelStandard: "",
    minSpec: "",
    maxSpec: "",
    isSpecSkipped: true,
    // Calculator allows a target chamber without Model Standard; conductance still calculates, judge becomes NA.
    calculationTarget: true,
  };
};

// When FAB/model changes, refresh each chamber's option list without forcing one tab's
// selected Model Standard into every other chamber.
const syncChamberSpecOptions = (chamber, specOptions) => {
  const spec = getSelectedSpec(specOptions, chamber.modelStandard);

  if (!spec) {
    return {
      ...chamber,
      specOptions,
      modelStandard: "",
      minSpec: "",
      maxSpec: "",
      isSpecSkipped: true,
      calculationTarget: chamber.calculationTarget !== false,
    };
  }

  return {
    ...chamber,
    specOptions,
    modelStandard: spec.value || spec.label || chamber.modelStandard,
    minSpec: spec.minSpec || "",
    maxSpec: spec.maxSpec || "",
    isSpecSkipped: false,
    calculationTarget: chamber.calculationTarget !== false,
  };
};

const applyCalculatorSpec = (chamber, value) => {
  if (!value) {
    return {
      ...chamber,
      modelStandard: "",
      minSpec: "",
      maxSpec: "",
      isSpecSkipped: true,
      // Keep the checkbox state. Calculator intentionally supports specless conductance with NA judge.
      calculationTarget: chamber.calculationTarget !== false,
    };
  }

  const next = applySpecToChamber(chamber, value);
  return {
    ...next,
    calculationTarget: true,
    isSpecSkipped: !next.minSpec && !next.maxSpec,
  };
};

const firstChamber = createCalculatorChamber([], {}, []);

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
  ...state,
  chambers: state.chambers.map((chamber) =>
    chamber.id === chamberId ? updater(chamber) : chamber
  ),
});

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
      // FAB/model reset the equipment-level default and then only seed chambers that had no choice yet.
      const baseEquipment = {
        ...state.equipment,
        [action.payload.name]: action.payload.value,
        modelStandard: "",
        minSpec: "",
        maxSpec: "",
      };
      const specOptions =
        baseEquipment.fab && baseEquipment.model
          ? getApplicableSpecs(state.options.modelStandards, baseEquipment)
          : [];
      const defaultSpec = specOptions[0] || null;
      const equipment = defaultSpec
        ? {
            ...baseEquipment,
            modelStandard: defaultSpec.value || defaultSpec.label || "",
            minSpec: defaultSpec.minSpec || "",
            maxSpec: defaultSpec.maxSpec || "",
          }
        : baseEquipment;

      return {
        ...state,
        equipment,
        chambers: state.chambers.map((chamber) =>
          syncChamberSpecOptions(
            defaultSpec && !chamber.modelStandard
              ? { ...chamber, modelStandard: defaultSpec.value || defaultSpec.label || "" }
              : chamber,
            specOptions
          )
        ),
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.SET_MODEL_STANDARD: {
      // Header Model Standard applies to the active chamber only; inactive chamber tabs stay independent.
      const specOptions = getApplicableSpecs(state.options.modelStandards, state.equipment);
      const spec = getSelectedSpec(specOptions, action.payload.value);

      return {
        ...state,
        equipment: {
          ...state.equipment,
          modelStandard: action.payload.value,
          minSpec: spec?.minSpec || "",
          maxSpec: spec?.maxSpec || "",
        },
        chambers: state.chambers.map((chamber) =>
          chamber.id === state.activeChamberId
            ? applyCalculatorSpec({ ...chamber, specOptions }, action.payload.value)
            : { ...chamber, specOptions }
        ),
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.ADD_CHAMBER: {
      if (state.chambers.length >= MAX_CHAMBER_COUNT) return state;
      const chamber = createCalculatorChamber(
        state.chambers,
        state.equipment,
        getApplicableSpecs(state.options.modelStandards, state.equipment)
      );
      const chambers = resequenceChambers([...state.chambers, chamber]);

      return {
        ...state,
        chambers,
        activeChamberId: chamber.id,
      };
    }

    case VC_CALCULATOR_ACTION_TYPES.REMOVE_CHAMBER: {
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
      return {
        ...state,
        activeChamberId: action.payload.chamberId,
      };

    case VC_CALCULATOR_ACTION_TYPES.UPDATE_CHAMBER_FIELD:
      return updateChamber(state, action.payload.chamberId, (chamber) => {
        if (action.payload.name === "modelStandard") {
          // Clearing Model Standard must not clear calculationTarget on Calculator.
          return applyCalculatorSpec(chamber, action.payload.value);
        }

        return {
          ...chamber,
          [action.payload.name]:
            action.payload.name === "calculationTarget"
              ? Boolean(action.payload.value)
              : action.payload.value,
        };
      });

    case VC_CALCULATOR_ACTION_TYPES.ADD_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId || state.activeChamberId, (chamber) => ({
        ...chamber,
        pipeList: [...chamber.pipeList, createEmptyPipeRow(PIPE_TYPE.PIPE)],
      }));

    case VC_CALCULATOR_ACTION_TYPES.REMOVE_SELECTED_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId || state.activeChamberId, (chamber) => {
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
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        selectedPipeRowId: action.payload.rowId,
      }));

    case VC_CALCULATOR_ACTION_TYPES.UPDATE_PIPE_ROW:
      return updateChamber(state, action.payload.chamberId, (chamber) => ({
        ...chamber,
        pipeList: chamber.pipeList.map((row) => {
          if (row.id !== action.payload.rowId) return row;

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
