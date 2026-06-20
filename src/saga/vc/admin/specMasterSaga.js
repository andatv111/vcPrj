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

// API 오류 형태가 아직 확정되지 않았기 때문에 화면에는 최대한 사람이 읽을 수 있는 메시지를 전달한다.
// B/E가 message/errorMessage/payload 중 어떤 이름을 쓰더라도 reducer.error에는 문자열만 넣는다.
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

// 공통코드 API, SpecMaster filter API, row 기반 후보값을 모두 select option 형태로 맞춘다.
// 화면 컴포넌트는 { value, label }만 알면 되므로 API별 필드명 차이는 saga에서 흡수한다.
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

// 같은 코드가 여러 API에서 중복으로 내려올 수 있어 value 기준으로 한 번만 남긴다.
const uniqueOptions = (items = []) => {
  const map = new Map();
  toArray(items).map(normalizeOption).forEach((item) => {
    if (item.value && !map.has(item.value)) map.set(item.value, item);
  });
  return Array.from(map.values());
};

// B/E 필드명이 일부 다르거나 GoodDocs 오타가 있어도 화면 row 이름은 여기서 통일한다.
// 이후 reducer/component는 specId, fabId, setModelNm, upperCd 같은 화면 표준 이름만 사용한다.
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

// Spring paging(content/number/size)과 일반 배열 응답을 모두 좌측 grid paging 상태로 변환한다.
const normalizePage = (response, fallbackPage) => ({
  page: Number(response?.number ?? response?.page ?? fallbackPage.page ?? 0),
  size: Number(response?.size ?? fallbackPage.size ?? 10),
  totalPages: Number(response?.totalPages ?? Math.max(1, Math.ceil(toArray(response).length / (fallbackPage.size || 10)))),
  totalElements: Number(response?.totalElements ?? response?.totalCount ?? toArray(response).length),
});

// init API 두 개의 결과를 SearchPanel/Popup select들이 바로 쓸 수 있는 options로 만든다.
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

// 저장 payload는 화면 form 그대로 보내지 않고 DB row 의미에 맞는 key만 추린다.
// 상세스펙 유무가 Y인 Master는 자체 MIN/MAX 기준을 갖지 않으므로 빈 값으로 보낸다.
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
    // selectleftpaging은 원칙상 Master만 내려와야 하지만, preview/초기 B/E가 전체 row를 줄 수 있어 한 번 더 방어한다.
    const rows = toArray(response).map(normalizeSpecRow).filter((row) => !row.upperCd);
    yield put(specMasterActions.searchSuccess({ rows, page: normalizePage(response, page) }));

    // 좌측 첫 row가 선택되면 사용자가 radio를 누르지 않아도 우측 Detail Grid가 바로 채워진다.
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
    // Detail row는 upperCd가 선택 Master specId인 하위 row다.
    // 화면에서는 Master와 같은 column 이름을 쓰므로 normalizeSpecRow를 공통으로 사용한다.
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
      // Master 수정과 Detail 수정은 같은 PATCH API를 사용한다.
      yield call(specMasterApi.updateSpec, popup.form.specId, payload);
    } else {
      // Master 신규는 upperCd 없이 상위 row로 저장한다.
      yield call(specMasterApi.createMaster, payload);
    }

    yield put(specMasterActions.saveSuccess("Spec Master 저장이 완료되었습니다."));
    const state = yield select(selectSpecMasterState);
    // 저장 후 좌측 grid를 다시 조회한다. 기존 선택 Master가 있으면 Detail도 다시 맞춰 최신화한다.
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

    // 삭제 API는 Master/Detail 공통이다. Master 삭제 시 children 처리 정책은 B/E service에 있다.
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
