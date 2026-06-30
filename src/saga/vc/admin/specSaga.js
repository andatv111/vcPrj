import { all, call, delay, put, select, takeLatest } from "redux-saga/effects";

import { SPEC_MASTER_ACTION_TYPES, specMasterActions } from "@/store/vc/spec/action";
import {
  selectSpecMgmtPopup,
  selectSpecMgmtSearch,
  selectSpecMgmtState,
} from "@/store/vc/spec/specSelector";
import specApi from "@/service/api/vc/admin/specApi";

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

const normalizeOptions = (response = {}) => ({
  fabIds: uniqueOptions(response.fabIds),
  areas: uniqueOptions(response.areas),
  makers: uniqueOptions(response.makers),
  setModelNms: uniqueOptions(response.setModelNms),
  specNms: uniqueOptions(response.specNms),
  operLargeCatgVals: uniqueOptions(response.operLargeCatgVals),
  operMidCatgVals: uniqueOptions(response.operMidCatgVals),
  chambModelNms: uniqueOptions(response.chambModelNms),
  areasByFab: Object.fromEntries(Object.entries(response.areasByFab || {}).map(([key, value]) => [key, uniqueOptions(value)])),
  makersByArea: Object.fromEntries(Object.entries(response.makersByArea || {}).map(([key, value]) => [key, uniqueOptions(value)])),
  modelsByFab: Object.fromEntries(Object.entries(response.modelsByFab || {}).map(([key, value]) => [key, uniqueOptions(value)])),
  modelsByMaker: Object.fromEntries(Object.entries(response.modelsByMaker || {}).map(([key, value]) => [key, uniqueOptions(value)])),
  operMidByLarge: Object.fromEntries(Object.entries(response.operMidByLarge || {}).map(([key, value]) => [key, uniqueOptions(value)])),
});

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
  delYn: row.delYn || "N",
  raw: row,
});

// 팝업 form 값을 GoodDocs 저장/수정 request body에 맞춘다.
const sanitizeSpecPayload = (form = {}, user = {}) => ({
  specNm: form.specNm,
  fabId: form.fabId,
  area: form.area,
  maker: form.maker,
  setModelNm: form.setModelNm,
  operLargeCatgVal: form.operLargeCatgVal,
  operMidCatgVal: form.operMidCatgVal,
  chambModelNm: form.chambModelNm,
  modelSpecUseYn: form.modelSpecUseYn || "0",
  srcGbnCd: form.srcGbnCd || "U",
  detSearYn: form.detSearYn || "N",
  manualRegYn: form.manualRegYn || "N",
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

const validatePopup = (scope, form) => {
  if (scope === "master" && !form.fabId) return "FAB은 필수입니다.";
  if (scope === "master" && !form.area && form.manualRegYn !== "Y") return "AREA는 필수입니다.";
  if (scope === "master" && !form.maker && form.manualRegYn !== "Y") return "MAKER는 필수입니다.";
  if (scope === "master" && !form.setModelNm) return "MODEL은 필수입니다.";
  if (scope === "master" && form.detSearYn !== "Y" && !form.specNm) return "모델관리기준명은 필수입니다.";
  if (scope === "detail" && !form.operLargeCatgVal) return "공정대분류는 필수입니다.";
  if (scope === "detail" && !form.operMidCatgVal) return "공정중분류는 필수입니다.";
  if (scope === "detail" && !form.chambModelNm) return "CHAMBER SPEC은 필수입니다.";
  if (scope === "detail" && !form.specNm) return "모델관리기준명은 필수입니다.";
  if (form.detSearYn !== "Y" && (!form.specMinVal || !form.specMaxVal)) return "MIN/MAX SPEC은 필수입니다.";
  if (!form.chgrNm && !form.chgrEmpno) return "장비담당자는 필수입니다.";
  return "";
};

function* loadFilterOptionsFlow() {
  try {
    // 팝업 콤보 후보는 상단 검색 콤보와 분리된 기존 전용 API에서 받는다.
    const response = yield call(specApi.selectFilterOptions);
    yield put(specMasterActions.fetchPopupOptionsSuccess(normalizeOptions(response)));
  } catch (error) {
    yield put(specMasterActions.fetchPopupOptionsFailure(getErrorMessage(error)));
  }
}

function* loadFabOptionsFlow() {
  try {
    const response = yield call(specApi.getFabOptions);
    yield put(specMasterActions.fetchFabOptionsSuccess(uniqueOptions(response)));
  } catch (error) {
    yield put(specMasterActions.fetchFabOptionsFailure(getErrorMessage(error)));
  }
}

function* fetchModelOptionsFlow(action) {
  const fabId = action.payload?.fabId || "";
  if (!fabId) {
    yield put(specMasterActions.clearModelOptions());
    return;
  }

  try {
    const response = yield call(specApi.getSpecModelOptions, fabId);
    yield put(specMasterActions.fetchModelOptionsSuccess({
      fabId,
      items: uniqueOptions(response),
    }));
  } catch (error) {
    yield put(specMasterActions.fetchModelOptionsFailure({
      fabId,
      error: getErrorMessage(error),
    }));
  }
}

function* loadSpecConditionFlow(action = {}) {
  try {
    const search = yield select(selectSpecMgmtSearch);
    const state = yield select(selectSpecMgmtState);
    const requestedSpecId = action.payload?.selectedSpecId ?? state.selectedSpecId;
    const requestedDetailSpecId = action.payload?.selectedDetailSpecId ?? state.selectedDetailSpecId;

    // GoodDocs selectcondition API: 조회조건과 현재 선택 Master를 넘겨 Master/Detail을 함께 받는다.
    const response = yield call(specApi.selectCondition, {
      search,
    });

    const allRows = toArray(response.rows || response.content || response);
    // B/E 조회조건이 기본이지만, 삭제 데이터가 섞여 와도 grid에는 노출하지 않는다.
    const rows = allRows.map(normalizeSpecRow).filter((row) => row.delYn !== "Y" && !row.upperCd);
    const details = toArray(response.details)
      .map(normalizeSpecRow)
      .filter((row) => row.delYn !== "Y" && row.upperCd);
    const selectedSpecId = rows.some((row) => row.specId === requestedSpecId)
      ? requestedSpecId
      : rows[0]?.specId || "";

    yield put(specMasterActions.searchSuccess({
      rows,
      details,
      selectedSpecId,
      selectedDetailSpecId: requestedDetailSpecId,
    }));
  } catch (error) {
    yield put(specMasterActions.searchFailure(getErrorMessage(error)));
  }
}

function* fetchSpecNameSuggestionsFlow(action) {
  const fabId = action.payload?.fabId || "";
  const specNm = String(action.payload?.specNm || "").trim();

  if (!fabId || !specNm) {
    yield put(specMasterActions.clearSpecNameSuggestions());
    return;
  }

  try {
    yield delay(200);

    const response = yield call(specApi.searchSpecNameSuggestions, { fabId, specNm });
    const items = toArray(response).map(normalizeOption).filter((item) => item.value);
    yield put(specMasterActions.fetchSpecNameSuggestionsSuccess({ fabId, specNm, items }));
  } catch (error) {
    yield put(specMasterActions.fetchSpecNameSuggestionsFailure(getErrorMessage(error)));
  }
}

function* initSpecMasterFlow() {
  try {
    // 최초 진입에서는 FAB 콤보와 grid만 병렬 조회한다. MODEL/specNm/popup 콤보는 필요할 때 조회한다.
    yield all([
      call(loadFabOptionsFlow),
      call(loadSpecConditionFlow),
    ]);
    yield put(specMasterActions.initSuccess());
  } catch (error) {
    const message = getErrorMessage(error);
    yield put(specMasterActions.initFailure(message));
    yield put(specMasterActions.searchFailure(message));
  }
}

function* saveSpecMasterFlow() {
  try {
    const popup = yield select(selectSpecMgmtPopup);
    const user = yield select((state) => state.userInfo?.user || {});
    const validationMessage = validatePopup(popup.scope, popup.form);

    if (validationMessage) throw new Error(validationMessage);

    const payload = sanitizeSpecPayload(popup.form, user);
    let savedRow;
    let nextSelectedSpecId = popup.form.specId;
    let nextSelectedDetailSpecId = "";

    // Detail 신규는 부모 Master specId가 path parameter가 되고, 수정은 row 본인의 specId가 path parameter가 된다.
    if (popup.scope === "detail") {
      const parentSpecId = popup.form.upperCd;
      if (!parentSpecId) throw new Error("상세 Spec을 등록할 상위 Master를 선택해 주세요.");

      if (popup.mode === "edit" && popup.form.specId) {
        savedRow = yield call(specApi.updateSpec, popup.form.specId, payload);
      } else {
        savedRow = yield call(specApi.createChild, parentSpecId, payload);
      }
      nextSelectedSpecId = parentSpecId;
      nextSelectedDetailSpecId = savedRow?.specId || popup.form.specId || "";
    } else if (popup.mode === "edit" && popup.form.specId) {
      savedRow = yield call(specApi.updateSpec, popup.form.specId, payload);
      nextSelectedSpecId = savedRow?.specId || popup.form.specId;
    } else {
      savedRow = yield call(specApi.createMaster, payload);
      nextSelectedSpecId = savedRow?.specId || "";
    }

    yield put(specMasterActions.saveSuccess("Spec Master 저장이 완료되었습니다."));
    // 저장한 값이 기존 검색조건에서 벗어나도 정확한 row와 페이지를 다시 찾을 수 있게 전체 목록으로 복귀한다.
    yield put(specMasterActions.resetSearch());
    yield put(specMasterActions.searchRequest({
      selectedSpecId: nextSelectedSpecId,
      selectedDetailSpecId: nextSelectedDetailSpecId,
    }));
  } catch (error) {
    yield put(specMasterActions.saveFailure(getErrorMessage(error)));
  }
}

function* deleteSpecMasterFlow(action) {
  try {
    const state = yield select(selectSpecMgmtState);
    const specId = action.payload.specId;
    const scope = action.payload.scope;
    const user = yield select((rootState) => rootState.userInfo?.user || {});
    if (!specId) throw new Error("삭제할 Spec을 선택해 주세요.");

    const sourceRows = scope === "detail" ? state.detailRows : state.masterRows;
    const deletedIndex = sourceRows.findIndex((row) => row.specId === specId);
    const nextRow = sourceRows[deletedIndex + 1] || sourceRows[deletedIndex - 1] || null;
    const nextSelectedSpecId = scope === "master" ? nextRow?.specId || "" : state.selectedSpecId;
    const nextSelectedDetailSpecId = scope === "detail" ? nextRow?.specId || "" : "";

    yield call(specApi.markSpecDeleted, specId, user?.empNo || user?.empno || "");
    yield put(specMasterActions.deleteSuccess("Spec Master 삭제 처리가 완료되었습니다."));
    yield put(specMasterActions.searchRequest({
      selectedSpecId: nextSelectedSpecId,
      selectedDetailSpecId: nextSelectedDetailSpecId,
    }));
  } catch (error) {
    yield put(specMasterActions.deleteFailure(getErrorMessage(error)));
  }
}

function* openEditPopupFlow(action) {
  try {
    const row = action.payload?.row;
    const scope = action.payload?.scope;
    if (!row?.specId) return;

    // 수정 팝업은 grid row로 먼저 열고, 단건 조회 결과로 form 값을 다시 보정한다.
    const latestRow = yield call(specApi.getSpec, row.specId);
    yield put(specMasterActions.hydratePopupForm({ scope, row: normalizeSpecRow(latestRow) }));
  } catch (error) {
    yield put(specMasterActions.saveFailure(getErrorMessage(error)));
  }
}

export function* watchSpecSaga() {
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.INIT_REQUEST, initSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.FETCH_FAB_OPTIONS_REQUEST, loadFabOptionsFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.FETCH_MODEL_OPTIONS_REQUEST, fetchModelOptionsFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.FETCH_SPEC_NAME_SUGGESTIONS_REQUEST, fetchSpecNameSuggestionsFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.FETCH_POPUP_OPTIONS_REQUEST, loadFilterOptionsFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SEARCH_REQUEST, loadSpecConditionFlow);
  yield takeLatest(
    [SPEC_MASTER_ACTION_TYPES.OPEN_CREATE_POPUP, SPEC_MASTER_ACTION_TYPES.OPEN_EDIT_POPUP],
    function* loadPopupOptionsOnOpen() {
      yield put(specMasterActions.fetchPopupOptionsRequest());
    }
  );
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.OPEN_EDIT_POPUP, openEditPopupFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.SAVE_REQUEST, saveSpecMasterFlow);
  yield takeLatest(SPEC_MASTER_ACTION_TYPES.DELETE_REQUEST, deleteSpecMasterFlow);
}

export default function* specSaga() {
  yield all([watchSpecSaga()]);
}
