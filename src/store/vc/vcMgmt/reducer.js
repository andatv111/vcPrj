import { SPEC_MASTER_ACTION_TYPES } from "./action";

const DEFAULT_SEARCH = {
  fabId: "",
  setModelNm: "",
  specNm: "",
};

const DEFAULT_OPTIONS = {
  fabIds: [],
  areas: [],
  makers: [],
  setModelNms: [],
  specNms: [],
  operLargeCatgVals: [],
  operMidCatgVals: [],
  chambModelNms: [],
  areasByFab: {},
  makersByArea: {},
  modelsByFab: {},
  modelsByMaker: {},
  operMidByLarge: {},
};

const EMPTY_POPUP_FORM = {
  specId: "",
  specNm: "",
  fabId: "",
  area: "",
  maker: "",
  setModelNm: "",
  operLargeCatgVal: "",
  operMidCatgVal: "",
  chambModelNm: "",
  detSearYn: "N",
  manualRegYn: "N",
  modelSpecUseYn: "0",
  mgmtTgtYn: "Y",
  srcGbnCd: "U",
  upperCd: "",
  specMinVal: "",
  specMaxVal: "",
  chgrEmpno: "",
  chgrNm: "",
  specDesc: "",
};

export const initialSpecMasterState = {
  search: { ...DEFAULT_SEARCH },
  options: { ...DEFAULT_OPTIONS },

  masterRows: [],
  detailRows: [],
  selectedSpecId: "",
  selectedDetailSpecId: "",

  page: {
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
  },

  popup: {
    visible: false,
    mode: "create",
    scope: "master",
    form: { ...EMPTY_POPUP_FORM },
  },

  loading: {
    init: false,
    search: false,
    details: false,
    save: false,
    delete: false,
  },
  error: null,
  message: "",
};

const toFlag = (value, trueValue = "Y", falseValue = "N") =>
  value === true || value === trueValue || value === "1" ? trueValue : falseValue;

const normalizePopupForm = (row = {}, scope = "master", selectedMaster = null) => {
  const parent = scope === "detail" ? selectedMaster || {} : {};

  return {
    ...EMPTY_POPUP_FORM,
    ...parent,
    ...row,
    fabId: row.fabId || parent.fabId || "",
    area: row.area || parent.area || "",
    maker: row.maker || parent.maker || "",
    setModelNm: row.setModelNm || parent.setModelNm || "",
    upperCd: scope === "detail" ? row.upperCd || parent.specId || "" : row.upperCd || "",
    detSearYn: toFlag(row.detSearYn || parent.detSearYn || "N"),
    manualRegYn: toFlag(row.manualRegYn || "N"),
    modelSpecUseYn: row.modelSpecUseYn || "0",
    mgmtTgtYn: toFlag(row.mgmtTgtYn || "Y"),
    srcGbnCd: row.srcGbnCd || "U",
    specMinVal: row.specMinVal ?? "",
    specMaxVal: row.specMaxVal ?? "",
  };
};

const setLoading = (state, key, value) => ({
  ...state,
  loading: {
    ...state.loading,
    [key]: value,
  },
});

const findSelectedMaster = (state) => state.masterRows.find((row) => row.specId === state.selectedSpecId) || null;

const specMasterReducer = (state = initialSpecMasterState, action = {}) => {
  switch (action.type) {
    case SPEC_MASTER_ACTION_TYPES.INIT_REQUEST:
      return setLoading(state, "init", true);

    case SPEC_MASTER_ACTION_TYPES.INIT_SUCCESS:
      return {
        ...setLoading(state, "init", false),
        options: {
          ...DEFAULT_OPTIONS,
          ...(action.payload.options || {}),
        },
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.INIT_FAILURE:
      return {
        ...setLoading(state, "init", false),
        error: action.payload.error,
      };

    case SPEC_MASTER_ACTION_TYPES.SET_SEARCH_FIELD: {
      const { name, value } = action.payload;
      const nextSearch = {
        ...state.search,
        [name]: value,
      };

      if (name === "fabId") {
        nextSearch.setModelNm = "";
      }

      return {
        ...state,
        search: nextSearch,
      };
    }

    case SPEC_MASTER_ACTION_TYPES.RESET_SEARCH:
      return {
        ...state,
        search: { ...DEFAULT_SEARCH },
      };

    case SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST:
      return {
        ...setLoading(state, "search", true),
        error: null,
        message: "",
      };

    case SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS: {
      const rows = action.payload.rows || [];
      const detailRows = action.payload.details || [];
      const selectedSpecId = rows.some((row) => row.specId === action.payload.selectedSpecId)
        ? action.payload.selectedSpecId
        : rows[0]?.specId || "";
      const selectedDetailSpecId = detailRows.some((row) => row.specId === action.payload.selectedDetailSpecId)
        ? action.payload.selectedDetailSpecId
        : detailRows[0]?.specId || "";

      return {
        ...state,
        loading: {
          ...state.loading,
          search: false,
          details: false,
        },
        masterRows: rows,
        detailRows,
        selectedSpecId,
        selectedDetailSpecId,
        page: {
          ...state.page,
          ...(action.payload.page || {}),
        },
        error: null,
      };
    }

    case SPEC_MASTER_ACTION_TYPES.SEARCH_FAILURE:
      return {
        ...setLoading(state, "search", false),
        error: action.payload.error,
      };

    case SPEC_MASTER_ACTION_TYPES.CHANGE_PAGE:
      return {
        ...state,
        page: {
          ...state.page,
          page: action.payload.page,
        },
      };

    case SPEC_MASTER_ACTION_TYPES.SELECT_MASTER:
      return {
        ...state,
        selectedSpecId: action.payload.specId,
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.SELECT_DETAIL:
      return {
        ...state,
        selectedDetailSpecId: action.payload.specId,
      };

    case SPEC_MASTER_ACTION_TYPES.OPEN_CREATE_POPUP:
      return {
        ...state,
        popup: {
          visible: true,
          mode: "create",
          scope: action.payload.scope,
          form: normalizePopupForm({}, action.payload.scope, findSelectedMaster(state)),
        },
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.OPEN_EDIT_POPUP:
      return {
        ...state,
        popup: {
          visible: true,
          mode: "edit",
          scope: action.payload.scope,
          form: normalizePopupForm(action.payload.row, action.payload.scope, findSelectedMaster(state)),
        },
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.HYDRATE_POPUP_FORM:
      return {
        ...state,
        popup: {
          ...state.popup,
          scope: action.payload.scope,
          form: normalizePopupForm(action.payload.row, action.payload.scope, findSelectedMaster(state)),
        },
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.CLOSE_POPUP:
      return {
        ...state,
        popup: {
          ...initialSpecMasterState.popup,
          form: { ...EMPTY_POPUP_FORM },
        },
      };

    case SPEC_MASTER_ACTION_TYPES.SET_POPUP_FIELD: {
      const form = {
        ...state.popup.form,
        [action.payload.name]: action.payload.value,
      };

      if (action.payload.name === "detSearYn" && action.payload.value === "Y") {
        form.specNm = "";
        form.specMinVal = "";
        form.specMaxVal = "";
      }

      if (action.payload.name === "manualRegYn" && action.payload.value === "Y") {
        form.area = "";
        form.maker = "";
      }

      if (action.payload.name === "fabId") {
        form.area = "";
        form.maker = "";
        form.setModelNm = "";
      }

      if (action.payload.name === "area") {
        form.maker = "";
        form.setModelNm = "";
      }

      if (action.payload.name === "maker") {
        form.setModelNm = "";
      }

      if (action.payload.name === "operLargeCatgVal") {
        form.operMidCatgVal = "";
      }

      return {
        ...state,
        popup: {
          ...state.popup,
          form,
        },
      };
    }

    case SPEC_MASTER_ACTION_TYPES.SAVE_REQUEST:
      return {
        ...setLoading(state, "save", true),
        error: null,
        message: "",
      };

    case SPEC_MASTER_ACTION_TYPES.SAVE_SUCCESS:
      return {
        ...setLoading(state, "save", false),
        popup: {
          ...initialSpecMasterState.popup,
          form: { ...EMPTY_POPUP_FORM },
        },
        message: action.payload.message,
      };

    case SPEC_MASTER_ACTION_TYPES.SAVE_FAILURE:
      return {
        ...setLoading(state, "save", false),
        error: action.payload.error,
      };

    case SPEC_MASTER_ACTION_TYPES.DELETE_REQUEST:
      return {
        ...setLoading(state, "delete", true),
        error: null,
        message: "",
      };

    case SPEC_MASTER_ACTION_TYPES.DELETE_SUCCESS:
      return {
        ...setLoading(state, "delete", false),
        message: action.payload.message,
      };

    case SPEC_MASTER_ACTION_TYPES.DELETE_FAILURE:
      return {
        ...setLoading(state, "delete", false),
        error: action.payload.error,
      };

    default:
      return state;
  }
};

export default specMasterReducer;
