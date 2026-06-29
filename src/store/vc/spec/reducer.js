import { SPEC_MASTER_ACTION_TYPES } from "@/store/vc/spec/action";

const DEFAULT_SEARCH = {
  fabId: "",
  setModelNm: "",
  specNm: "",
};

const DEFAULT_SEARCH_OPTIONS = {
  fabIds: [],
  setModelNms: [],
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
  searchOptions: { ...DEFAULT_SEARCH_OPTIONS },
  // options는 팝업 form에서만 사용한다. 상단 검색 콤보는 searchOptions를 사용한다.
  options: { ...DEFAULT_OPTIONS },
  specNameSuggestions: [],

  masterRows: [],
  detailRows: [],
  selectedSpecId: "",
  selectedDetailSpecId: "",


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
    fabOptions: false,
    modelOptions: false,
    specNameSuggestions: false,
    popupOptions: false,
  },
  error: null,
  message: "",
};

const toFlag = (value, trueValue = "Y", falseValue = "N") =>
  value === true || value === trueValue || value === "1" ? trueValue : falseValue;

const getOptionValues = (items = []) => items.map((item) => item.value || item.label || item).filter(Boolean);

const inferMasterHierarchy = (row, options) => {
  if (!row.fabId) return { area: "", maker: "" };

  const maker = Object.entries(options.modelsByMaker || {}).find(([, models]) =>
    getOptionValues(models).includes(row.setModelNm)
  )?.[0];
  const areas = getOptionValues(options.areasByFab?.[row.fabId]);
  const area =
    areas.find((candidate) => getOptionValues(options.makersByArea?.[candidate]).includes(maker)) ||
    areas[0] ||
    "";

  return {
    area,
    maker: maker || getOptionValues(options.makersByArea?.[area])[0] || "",
  };
};

const normalizePopupForm = (row = {}, scope = "master", selectedMaster = null, options = DEFAULT_OPTIONS) => {
  const parent = scope === "detail" ? selectedMaster || {} : {};
  const hierarchy = scope === "master" ? inferMasterHierarchy(row, options) : {};

  return {
    ...EMPTY_POPUP_FORM,
    ...parent,
    ...row,
    fabId: row.fabId || parent.fabId || "",
    area: row.area || parent.area || hierarchy.area || "",
    maker: row.maker || parent.maker || hierarchy.maker || "",
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
      return {
        ...state,
        loading: {
          ...state.loading,
          init: true,
          fabOptions: true,
        },
      };

    case SPEC_MASTER_ACTION_TYPES.INIT_SUCCESS:
      return setLoading(state, "init", false);

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
        nextSearch.specNm = "";
        return {
          ...state,
          search: nextSearch,
          searchOptions: {
            ...state.searchOptions,
            setModelNms: [],
          },
          specNameSuggestions: [],
          loading: {
            ...state.loading,
            modelOptions: false,
            specNameSuggestions: false,
          },
        };
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
        searchOptions: {
          ...state.searchOptions,
          setModelNms: [],
        },
        specNameSuggestions: [],
        loading: {
          ...state.loading,
          modelOptions: false,
          specNameSuggestions: false,
        },
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_REQUEST:
      return setLoading(state, "fabOptions", true);

    case SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_SUCCESS:
      return {
        ...setLoading(state, "fabOptions", false),
        searchOptions: {
          ...state.searchOptions,
          fabIds: action.payload.items || [],
        },
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_FAILURE:
      return {
        ...setLoading(state, "fabOptions", false),
        searchOptions: {
          ...state.searchOptions,
          fabIds: [],
        },
        error: action.payload.error,
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_REQUEST:
      return setLoading(state, "modelOptions", true);

    case SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_SUCCESS:
      // FAB을 빠르게 바꾼 동안 도착한 이전 요청의 응답은 현재 MODEL 콤보에 반영하지 않는다.
      if (action.payload.fabId !== state.search.fabId) return state;
      return {
        ...setLoading(state, "modelOptions", false),
        searchOptions: {
          ...state.searchOptions,
          setModelNms: action.payload.items || [],
        },
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_FAILURE:
      if (action.payload.fabId !== state.search.fabId) return state;
      return {
        ...setLoading(state, "modelOptions", false),
        searchOptions: {
          ...state.searchOptions,
          setModelNms: [],
        },
        error: action.payload.error,
      };

    case SPEC_MASTER_ACTION_TYPES.CLEAR_MODEL_OPTIONS:
      return {
        ...setLoading(state, "modelOptions", false),
        searchOptions: {
          ...state.searchOptions,
          setModelNms: [],
        },
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_REQUEST:
      return setLoading(state, "specNameSuggestions", true);

    case SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_SUCCESS:
      if (
        action.payload.fabId !== state.search.fabId ||
        action.payload.specNm !== String(state.search.specNm || "").trim()
      ) {
        return state;
      }
      return {
        ...setLoading(state, "specNameSuggestions", false),
        specNameSuggestions: action.payload.items || [],
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_FAILURE:
      return {
        ...setLoading(state, "specNameSuggestions", false),
        specNameSuggestions: [],
      };

    case SPEC_MASTER_ACTION_TYPES.CLEAR_SPEC_NAME_SUGGESTIONS:
      return {
        ...setLoading(state, "specNameSuggestions", false),
        specNameSuggestions: [],
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_REQUEST:
      return setLoading(state, "popupOptions", true);

    case SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_SUCCESS: {
      const options = {
        ...DEFAULT_OPTIONS,
        ...(action.payload.options || {}),
      };
      return {
        ...setLoading(state, "popupOptions", false),
        options,
        popup: state.popup.visible
          ? {
              ...state.popup,
              form: normalizePopupForm(
                state.popup.form,
                state.popup.scope,
                findSelectedMaster(state),
                options
              ),
            }
          : state.popup,
        error: null,
      };
    }

    case SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_FAILURE:
      return {
        ...setLoading(state, "popupOptions", false),
        error: action.payload.error,
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
      const selectedDetailSpecId = detailRows.some(
        (row) => row.upperCd === selectedSpecId && row.specId === action.payload.selectedDetailSpecId
      )
        ? action.payload.selectedDetailSpecId
        : detailRows.find((row) => row.upperCd === selectedSpecId)?.specId || "";

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
        error: null,
      };
    }

    case SPEC_MASTER_ACTION_TYPES.SEARCH_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          search: false,
          details: false,
        },
        error: action.payload.error,
      };

    case SPEC_MASTER_ACTION_TYPES.SELECT_MASTER: {
      const selectedSpecId = action.payload.specId;
      const selectedDetails = state.detailRows.filter((row) => row.upperCd === selectedSpecId);
      const requestedDetailSpecId = action.payload.selectedDetailSpecId || "";
      const selectedDetailSpecId = selectedDetails.some((row) => row.specId === requestedDetailSpecId)
        ? requestedDetailSpecId
        : selectedDetails[0]?.specId || "";

      return {
        ...setLoading(state, "details", false),
        selectedSpecId,
        selectedDetailSpecId,
        error: null,
      };
    }

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
          form: normalizePopupForm({}, action.payload.scope, findSelectedMaster(state), state.options),
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
          form: normalizePopupForm(action.payload.row, action.payload.scope, findSelectedMaster(state), state.options),
        },
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.HYDRATE_POPUP_FORM:
      return {
        ...state,
        popup: {
          ...state.popup,
          scope: action.payload.scope,
          form: normalizePopupForm(action.payload.row, action.payload.scope, findSelectedMaster(state), state.options),
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
