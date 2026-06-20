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
  // Detail 팝업은 선택된 Master의 FAB/MODEL 정보를 보여주되 수정하지 못하게 하는 화면이다.
  // 그래서 신규 Detail form을 만들 때 parent 값을 먼저 깔고, 실제 Detail row 값이 있으면 그 값으로 덮는다.
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

    case SPEC_MASTER_ACTION_TYPES.SET_SEARCH_FIELD:
      return {
        ...state,
        search: {
          ...state.search,
          [action.payload.name]: action.payload.value,
        },
      };

    case SPEC_MASTER_ACTION_TYPES.RESET_SEARCH:
      return {
        ...state,
        search: { ...DEFAULT_SEARCH },
      };

    case SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST:
      return {
        ...setLoading(state, "search", true),
        masterRows: [],
        detailRows: [],
        selectedSpecId: "",
        selectedDetailSpecId: "",
        error: null,
        message: "",
      };

    case SPEC_MASTER_ACTION_TYPES.SEARCH_SUCCESS: {
      const rows = action.payload.rows || [];
      // 조회 후 첫 Master를 자동 선택해 우측 Detail 조회가 이어지게 한다.
      // 실제 Detail API 호출은 saga가 FETCH_DETAILS_REQUEST로 분리해서 수행한다.
      const selectedSpecId = rows[0]?.specId || "";
      return {
        ...setLoading(state, "search", false),
        masterRows: rows,
        selectedSpecId,
        selectedDetailSpecId: "",
        detailRows: [],
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
        detailRows: [],
        selectedDetailSpecId: "",
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_REQUEST:
      return {
        ...setLoading(state, "details", true),
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_SUCCESS:
      if (state.selectedSpecId !== action.payload.specId) return state;
      return {
        ...setLoading(state, "details", false),
        detailRows: action.payload.rows || [],
        selectedDetailSpecId: action.payload.rows?.[0]?.specId || "",
        error: null,
      };

    case SPEC_MASTER_ACTION_TYPES.SELECT_DETAIL:
      return {
        ...state,
        selectedDetailSpecId: action.payload.specId,
      };

    case SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_FAILURE:
      return {
        ...setLoading(state, "details", false),
        error: action.payload.error,
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
        // 상세스펙 유무가 Y이면 Master 자체에는 기준명/MIN/MAX를 입력하지 않는다는 퍼블/업무 규칙이다.
        form.specNm = "";
        form.specMinVal = "";
        form.specMaxVal = "";
      }

      if (action.payload.name === "manualRegYn" && action.payload.value === "Y") {
        // 수기등록 Y일 때는 MODEL을 직접 입력하고 AREA/MAKER 콤보 의존을 끊는다.
        form.area = "";
        form.maker = "";
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
