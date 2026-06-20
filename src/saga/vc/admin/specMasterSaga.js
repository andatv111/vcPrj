import { all, call, put, select, takeLatest } from "redux-saga/effects";

import { SPEC_MASTER_ACTION_TYPES, specMasterActions } from "../../../store/vc/specMaster/action";
import {
  selectSpecMasterPage,
  selectSpecMasterPopup,
  selectSpecMasterSearch,
  selectSpecMasterSelectedMaster,
  selectSpecMasterState,
} from "../../../store/vc/specMaster/vcSpecMasterSelector";
import specMasterApi from "../../../service/api/vc/admin/specMasterApi";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (Array.isArray(value.content)) return value.content;
  if (Array.isArray(value.rows)) return value.rows;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.list)) return value.list;
  return [value];
};

const getErrorMessage = (error) => {
  if (!error) return "알 수 없는 오류가 발생했습니다.";
  if (typeof error === "string") return error;
  if (error.message && error.message !== "[object Object]") return error.message;
  if (error.errorMessage) return error.errorMessage;
  if (error.payload) {
    try {
      return JSON.stringify(error.payload);
    } catch {
      return "Spec Master API 처리 중 오류가 발생했습니다.";
    }
  }
  return "Spec Master API 처리 중 오류가 발생했습니다.";
};

const normalizeOption = (item) => {
  if (typeof item === "string") return { value: item, label: item };
  const value = item?.value ?? item?.commonCd ?? item?.code ?? item?.setModelNm ?? item?.specNm ?? item?.name ?? "";
  const label =
    item?.label ??
    item?.commonCdKoNm ??
    item?.commonCdEnNm ??
    item?.name ??
    item?.specNm ??
    item?.setModelNm ??
    value;
  return { value: String(value), label: String(label) };
};

const uniqueOptions = (items = []) => {
  const map = new Map();
  toArray(items).map(normalizeOption).forEach((item) => {
    if (item.value && !map.has(item.value)) map.set(item.value, item);
  });
  return Array.from(map.values());
};

const normalizeSpecRow = (row = {}, index = 0) => ({
  id: row.specId || row.id || `SPEC_ROW_${index + 1}`,
  specId: row.specId || row.id || "",
  no: row.no || index + 1,
  specNm: row.specNm || row.specName || "",
  fabId: row.fabId || row.fabCd || "",
  area: row.area || row.zoneCd || "",
  maker: row.maker || row.makerVal || "",
  setModelNm: row.setModelNm || row.model || "",
  operLargeCatgVal: row.operLargeCatgVal || row.processLarge || "",
  operMidCatgVal: row.operMidCatgVal || row.processMiddle || "",
  chambModelNm: row.chambModelNm || row.chamberSpec || "",
  modelSpecUseYn: row.modelSpecUseYn || "0",
  srcGbnCd: row.srcGbnCd || "U",
  detSearYn: row.detSearYn || "N",
  upperCd: row.upperCd || "",
  mgmtTgtYn: row.mgmtTgtYn || "Y",
  specMinVal: row.specMinVal ?? "",
  specMaxVal: row.specMaxVal ?? "",
  chgrEmpno: row.chgrEmpno || "",
  chgrNm: row.chgrNm || "",
  specDesc: row.specDesc || "",
  raw: row,
});

const normalizePage = (response, fallbackPage) => ({
  page: Number(response?.number ?? response?.page ?? fallbackPage.page ?? 0),
  size: Number(response?.size ?? fallbackPage.size ?? 10),
  totalPages: Number(response?.totalPages ?? Math.max(1, Math.ceil(toArray(response).length / (fallbackPage.size || 10)))),
  totalElements: Number(response?.totalElements ?? response?.totalCount ?? toArray(response).length),
});

const buildOptionsFromResponse = (response = {}) => {
  const rows = toArray(response.rows || response.specs || response);
  return {
    // FAB는 specMasterApi에서 공통코드 API 응답을 fabIds에 넣어준다.
    // fallbackFabIds는 selectfilteroptions가 함께 내려준 FAB 후보를 참고해야 할 때만 사용한다.
    fabIds: uniqueOptions(response.fabIds || response.fabs || response.fallbackFabIds || rows.map((row) => row.fabId).filter(Boolean)),
    areas: uniqueOptions(response.areas || response.zoneCds || rows.map((row) => row.area || row.zoneCd).filter(Boolean)),
    makers: uniqueOptions(response.makers || response.makerVals || rows.map((row) => row.maker || row.makerVal).filter(Boolean)),
    setModelNms: uniqueOptions(response.setModelNms || response.models || rows.map((row) => row.setModelNm).filter(Boolean)),
    specNms: uniqueOptions(response.specNms || rows.map((row) => row.specNm).filter(Boolean)),
    operLargeCatgVals: uniqueOptions(response.operLargeCatgVals || rows.map((row) => row.operLargeCatgVal).filter(Boolean)),
    operMidCatgVals: uniqueOptions(response.operMidCatgVals || rows.map((row) => row.operMidCatgVal).filter(Boolean)),
    chambModelNms: uniqueOptions(response.chambModelNms || rows.map((row) => row.chambModelNm).filter(Boolean)),
  };
};

const sanitizeSpecPayload = (form = {}, user = {}) => ({
  specNm: form.specNm,
  fabId: form.fabId,
  setModelNm: form.setModelNm,
  operLargeCatgVal: form.operLargeCatgVal,
  operMidCatgVal: form.operMidCatgVal,
  chambModelNm: form.chambModelNm,
  modelSpecUseYn: form.modelSpecUseYn || "0",
  srcGbnCd: form.srcGbnCd || "U",
  detSearYn: form.detSearYn || "N",
  upperCd: form.upperCd || "",
  mgmtTgtYn: form.mgmtTgtYn || "Y",
  specMinVal: form.detSearYn === "Y" ? "" : form.specMinVal,
  specMaxVal: form.detSearYn === "Y" ? "" : form.specMaxVal,
  chgrEmpno: form.chgrEmpno,
  chgrNm: form.chgrNm,
  specDesc: form.specDesc,
  regEmpno: user?.empNo || user?.empno || "",
  chgChgrEmpno: user?.empNo || user?.empno || "",
});

function* initSpecMasterFlow() {
  try {
    // API:
    // - GET /api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC
    // - GET /api/vc/specmaster/selectfilteroptions
    // 보냄: 초기 진입 조건. 현재는 별도 query 없이 전체 후보를 받는다.
    // 받음: FAB는 공통코드에서, 나머지 MODEL/SPEC/공정 후보는 SpecMaster filter API에서 받는다.
    const response = yield call(specMasterApi.getFilterOptions);
    yield put(specMasterActions.initSuccess(buildOptionsFromResponse(response)));
  } catch (error) {
    yield put(specMasterActions.initFailure(getErrorMessage(error)));
  }
}

function* searchSpecMasterFlow() {
  try {
    const search = yield select(selectSpecMasterSearch);
    const page = yield select(selectSpecMasterPage);
    // API: GET /api/vc/specmaster/selectleftpaging
    // 보냄: { page, size, fabId, setModelNm, specNm }
    // 받음: 좌측 Master grid paging rows. 화면 사상상 upperCd가 없는 Master row만 사용한다.
    const response = yield call(specMasterApi.searchMaster, { search, page });
    const rows = toArray(response).map(normalizeSpecRow).filter((row) => !row.upperCd);
    yield put(specMasterActions.searchSuccess({ rows, page: normalizePage(response, page) }));

    if (rows[0]?.specId) {
      yield put(specMasterActions.fetchDetailsRequest(rows[0].specId));
    }
  } catch (error) {
    yield put(specMasterActions.searchFailure(getErrorMessage(error)));
  }
}

function* fetchDetailsFlow(action) {
  try {
    const specId = action.payload.specId;
    // API: GET /api/vc/specmaster/{specId}/children
    // GoodDocs 10번은 POST로 적혀 있으나 조회이므로 adapter에서 GET 우선, POST fallback을 수행합니다.
    const response = yield call(specMasterApi.getChildren, specId);
    const rows = toArray(response).map(normalizeSpecRow);
    yield put(specMasterActions.fetchDetailsSuccess({ specId, rows }));
  } catch (error) {
    yield put(specMasterActions.fetchDetailsFailure(getErrorMessage(error)));
  }
}

function validatePopup(scope, form) {
  // Master와 Detail 팝업이 하나의 form을 공유하므로 scope별 필수값을 여기에서 분기한다.
  // Detail은 항상 상위 Master 아래에 생성되므로 공정/Chamber 필드가 필수이고, Master는 상세스펙/수기등록 스위치 규칙을 따른다.
  if (!form.fabId) return "FAB은 필수입니다.";
  if (scope === "master" && form.manualRegYn !== "Y" && !form.setModelNm) return "MODEL은 필수입니다.";
  if (scope === "master" && form.detSearYn !== "Y" && !form.specNm) return "모델관리기준명은 필수입니다.";
  if (scope === "detail" && !form.specNm) return "모델관리기준명은 필수입니다.";
  if (scope === "detail" && !form.operLargeCatgVal) return "공정대분류는 필수입니다.";
  if (scope === "detail" && !form.operMidCatgVal) return "공정중분류는 필수입니다.";
  if (scope === "detail" && !form.chambModelNm) return "CHAMBER SPEC은 필수입니다.";
  if (form.detSearYn !== "Y" && (!form.specMinVal || !form.specMaxVal)) return "MIN/MAX SPEC은 필수입니다.";
  if (!form.chgrNm && !form.chgrEmpno) return "장비담당자는 필수입니다.";
  return "";
}

function* saveSpecMasterFlow() {
  try {
    const popup = yield select(selectSpecMasterPopup);
    const selectedMaster = yield select(selectSpecMasterSelectedMaster);
    const user = yield select((state) => state.userInfo?.user || {});
    const validationMessage = validatePopup(popup.scope, popup.form);

    if (validationMessage) throw new Error(validationMessage);

    const payload = sanitizeSpecPayload(popup.form, user);

    if (popup.scope === "detail") {
      // Detail 신규 저장은 선택 Master의 specId가 upperCd가 되는 구조다.
      const parentSpecId = popup.form.upperCd || selectedMaster?.specId;
      if (!parentSpecId) throw new Error("상세 Spec을 등록할 상위 Master를 선택해 주세요.");

      if (popup.mode === "edit" && popup.form.specId) {
        yield call(specMasterApi.updateSpec, popup.form.specId, payload);
      } else {
        yield call(specMasterApi.createChild, parentSpecId, payload);
      }
    } else if (popup.mode === "edit" && popup.form.specId) {
      yield call(specMasterApi.updateSpec, popup.form.specId, payload);
    } else {
      yield call(specMasterApi.createMaster, payload);
    }

    yield put(specMasterActions.saveSuccess("Spec Master 저장이 완료되었습니다."));
    const state = yield select(selectSpecMasterState);
    yield put(specMasterActions.searchRequest());
    if (state.selectedSpecId) yield put(specMasterActions.fetchDetailsRequest(state.selectedSpecId));
  } catch (error) {
    yield put(specMasterActions.saveFailure(getErrorMessage(error)));
  }
}

function* deleteSpecMasterFlow(action) {
  try {
    const user = yield select((state) => state.userInfo?.user || {});
    const specId = action.payload.specId;
    if (!specId) throw new Error("삭제할 Spec을 선택해 주세요.");

    yield call(specMasterApi.deleteSpec, specId, user?.empNo || user?.empno || "");
    yield put(specMasterActions.deleteSuccess("Spec Master 삭제가 완료되었습니다."));
    yield put(specMasterActions.searchRequest());
  } catch (error) {
    yield put(specMasterActions.deleteFailure(getErrorMessage(error)));
  }
}

function* changePageFlow() {
  yield put(specMasterActions.searchRequest());
}

function* selectMasterFlow(action) {
  if (action.payload.specId) {
    yield put(specMasterActions.fetchDetailsRequest(action.payload.specId));
  }
}

export function* watchSpecMasterSaga() {
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.INIT_REQUEST, initSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST, searchSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.CHANGE_PAGE, changePageFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SELECT_MASTER, selectMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.FETCH_DETAILS_REQUEST, fetchDetailsFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SAVE_REQUEST, saveSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.DELETE_REQUEST, deleteSpecMasterFlow);
}

export default function* specMasterSaga() {
  yield all([watchSpecMasterSaga()]);
}
