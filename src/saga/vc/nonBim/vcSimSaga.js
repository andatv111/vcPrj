/**
 * V/C Simulation 비동기 흐름을 담당하는 saga입니다.
 * 화면 action을 B/E API 호출로 연결하고, 응답은 helper에서 화면 모델로 정리한 뒤 reducer에 전달합니다.
 */
import { all, call, delay, put, select, takeLatest } from "redux-saga/effects";

import { VC_CALCULATOR_ACTION_TYPES, vcCalculatorActions } from "../../../store/vc/vcCalculator/action";
import { selectVcCalculatorState } from "../../../store/vc/vcCalculator/vcSimSelector";
import { NON_BIM_ACTION_TYPES, nonBimActions } from "../../../store/vc/nonBim/action";
import { selectDrawings, selectNonBimState, selectSearch } from "../../../store/vc/nonBim/vcSimSelector";
import { VC_RESULT_ACTION_TYPES, vcResultActions } from "../../../store/vc/vcResult/action";
import { selectVcResultState } from "../../../store/vc/vcResult/vcSimSelector";
import vcSimApi from "../../../service/api/vc/sim/vcSimApi";

import {
  buildCalculatorCalculatePayload,
  buildEquipmentContextParams,
  buildFileDownloadName,
  buildForelineDownloadParams,
  buildNonBimCalculatePayload,
  downloadBlob,
  hasSpecOutRows,
  normalizeCalculationResult,
  normalizeChambersFromDrawing,
  normalizeDrawingList,
  toArray,
  validateChambersBeforeCalculate,
  validateNonBimBeforeCalculate,
} from "../../../components/vc/nonBim/core/NonBim.helper";

// 모든 saga 오류를 화면에 표시 가능한 문자열로 바꿉니다. 객체 오류가 그대로 alert에 노출되면 "[object Object]"가 되므로 여기서 막습니다.
const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;
  if (error.message && error.message !== "[object Object]") return error.message;
  if (error.errorMessage) return error.errorMessage;
  if (error.payload && typeof error.payload === "object") return JSON.stringify(error.payload);
  return "An unknown error occurred.";
};

const normalizeOptionItem = (item) => {
  if (typeof item === "string") return { value: item, label: item };
  const value = item?.value ?? item?.fabCd ?? item?.code ?? "";
  const label = item?.label ?? item?.name ?? value;
  return {
    value: String(value),
    label: String(label),
  };
};

const normalizeScreenOptions = (response = {}) => {
  // GET /non-bim/options 응답은 { fabs, pipeTypes } 형태입니다.
  // 화면 select가 바로 쓸 수 있도록 모든 option을 { value, label }로 통일합니다.
  const payload = response?.data || response || {};
  return {
    fabs: toArray(payload.fabs).map(normalizeOptionItem).filter((item) => item.value),
    pipeTypes: toArray(payload.pipeTypes).map(normalizeOptionItem).filter((item) => item.value),
  };
};

function* nonBimOptionsInitFlow() {
  try {
    // API: GET /api/vc/sim/non-bim/options
    // 보냄: 파라미터 없음
    // 받음: Search Conditions의 FAB 목록과 Pipe Grid의 pipeTypes
    const response = yield call(vcSimApi.getNonBimOptions);
    yield put(nonBimActions.initOptionsSuccess(normalizeScreenOptions(response)));
  } catch (error) {
    yield put(nonBimActions.initOptionsFailure(getErrorMessage(error)));
  }
}

// EQ ID 자동완성은 사용자가 마지막으로 입력한 keyword만 유효하게 처리합니다.
function* fetchEqSuggestionsFlow(action) {
  try {
    // 화면에는 입력값만 두고, 잦은 API 호출 제어는 saga에서 처리합니다.
    const keyword = action.payload?.keyword || "";

    yield delay(250);

    if (!keyword || keyword.length < 2) {
      yield put(nonBimActions.fetchEqSuggestionsSuccess([]));
      return;
    }

    // API: GET /api/vc/sim/non-bim/equipments
    // 보냄: { keyword } - EQ ID 자동완성 검색어
    // 받음: [{ eqId, label, ... }] - datalist에 표시할 설비 후보
    const response = yield call(vcSimApi.searchEqSuggestions, keyword);
    const items = toArray(response).map((item) => ({
      value: item.eqId,
      label: item.label,
      raw: item,
    }));

    yield put(nonBimActions.fetchEqSuggestionsSuccess(items));
  } catch (error) {
    yield put(nonBimActions.fetchEqSuggestionsFailure(getErrorMessage(error)));
  }
}

// Manual Drawing Results 조회는 항상 Redux에 저장된 현재 Search Conditions를 기준으로 실행합니다.
function* fetchManualDrawingsFlow() {
  try {
    const search = yield select(selectSearch);
    // API: GET /api/vc/sim/non-bim/manual-drawings
    // 보냄: { fabCd, eqId, woId } - 화면 Search Conditions
    // 받음: 설계포탈 수기 도면 목록. normalizeDrawingList가 Java DTO 필드를 화면 row 모델로 정리합니다.
    const response = yield call(vcSimApi.searchManualDrawings, search);
    yield put(nonBimActions.fetchManualDrawingsSuccess(normalizeDrawingList(response)));
  } catch (error) {
    yield put(nonBimActions.fetchManualDrawingsFailure(getErrorMessage(error)));
  }
}

// Foreline 다운로드는 row에서 받은 woId로 현재 drawing을 찾고, 그 row의 파일 보조키까지 함께 API에 전달합니다.
function* downloadForelineFlow(action) {
  try {
    const woId = action.payload?.woId;
    const drawings = yield select(selectDrawings);
    const drawing = drawings.find((item) => item.woId === woId);

    if (!drawing) throw new Error("Cannot find the selected drawing for download.");

    // API: GET /api/vc/sim/non-bim/foreline-drawing/download
    // 보냄: { eqId, woId, fabCd, file, fileSeq }
    // 받음: 파일 Blob. downloadBlob이 브라우저 다운로드를 트리거합니다.
    const blob = yield call(vcSimApi.downloadForelineDrawing, buildForelineDownloadParams(drawing));

    yield call(downloadBlob, blob, buildFileDownloadName(drawing));
    yield put(nonBimActions.downloadForelineSuccess());
  } catch (error) {
    yield put(nonBimActions.downloadForelineFailure(getErrorMessage(error)));
  }
}

// Manual Drawing row 선택 후에는 Chamber 상세와 Model Standard 옵션을 B/E에서 다시 조회합니다.
function* fetchSelectedDrawingDetailsFlow(action) {
  const woId = action.payload?.woId;
  const drawings = yield select(selectDrawings);
  const drawing = drawings.find((item) => item.woId === woId);

  if (!drawing) return;

  try {
    // API: GET /api/vc/sim/non-bim/chambers
    // 보냄: { eqId, woId, fabCd, setModelNm, file, fileSeq }
    // 받음: 선택 도면의 실제 Chamber명과 pipeRows. 기존 Chamber명은 화면에서 재번호 매기지 않고 유지합니다.
    const chamberResponse = yield call(vcSimApi.getDrawingChambers, buildEquipmentContextParams(drawing));
    const rawChambers = toArray(chamberResponse);
    const chambers = normalizeChambersFromDrawing({ ...drawing, chambers: rawChambers });
    yield put(nonBimActions.fetchDrawingChambersSuccess({ woId, chambers }));
  } catch (error) {
    yield put(nonBimActions.fetchDrawingChambersFailure(getErrorMessage(error)));
  }

  try {
    // API: GET /api/vc/sim/non-bim/equipment-spec-options
    // 보냄: { eqId, fabCd, setModelNm, woId, file, fileSeq }
    // 받음: 선택 장비/도면에 적용 가능한 Model Standard와 Min/Max Spec 목록
    const options = yield call(vcSimApi.getEquipmentSpecOptions, buildEquipmentContextParams(drawing));
    yield put(nonBimActions.fetchModelStandardOptionsSuccess({ woId, options }));
  } catch (error) {
    yield put(nonBimActions.fetchModelStandardOptionsFailure(getErrorMessage(error)));
  }
}

// Non-BIM 계산은 선택 도면과 Chamber 입력을 검증한 뒤 B/E 계산 API를 호출하고 결과 팝업을 엽니다.
function* nonBimCalculateFlow() {
  try {
    // Non-BIM은 선택된 WO ID와 Chamber별 Model Standard/Min/Max Spec이 있어야 계산할 수 있습니다.
    const state = yield select(selectNonBimState);

    const validation = validateNonBimBeforeCalculate({
      selectedDrawing: state.selectedDrawing,
      chambers: state.chambers,
    });

    if (!validation.valid) throw new Error(validation.message);

    // buildNonBimCalculatePayload가 Java VcSimCalculateRequest에 맞는 body를 만듭니다.
    // API: POST /api/vc/sim/non-bim/calculate
    // 보냄: { sourceType, woId, search, equipment, chambers[].pipeList }
    // 받음: { success, data: { basicInfo, rows } } 성격의 계산 결과
    const payload = buildNonBimCalculatePayload(state);
    const response = yield call(vcSimApi.calculateNonBim, payload);
    const result = normalizeCalculationResult(response, payload);

    yield put(nonBimActions.calculateSuccess(result));
    yield put(vcResultActions.openResultPopup(result));
  } catch (error) {
    yield put(nonBimActions.calculateFailure(getErrorMessage(error)));
  }
}

function* calculatorInitFlow() {
  try {
    // API: GET /api/vc/sim/calculator/options
    // 보냄: 파라미터 없음
    // 받음: Calculator에서 선택 가능한 FAB, MODEL, Model Standard, Pipe Type 목록
    const response = yield call(vcSimApi.getCalculatorOptions);
    yield put(vcCalculatorActions.initSuccess(response));
  } catch (error) {
    yield put(vcCalculatorActions.initFailure(getErrorMessage(error)));
  }
}

// Calculator 계산은 도면 선택 없이 사용자가 직접 입력한 Chamber/Pipe로 계산합니다.
function* vcCalculatorCalculateFlow() {
  try {
    // Non-BIM과 달리 Calculator는 Model Standard가 없어도 calculationTarget이 켜져 있으면 conductance를 계산합니다.
    // 단, Spec이 없으면 판정만 NA가 됩니다.
    const state = yield select(selectVcCalculatorState);

    const validation = validateChambersBeforeCalculate(state.chambers, { allowSpecless: true });

    if (!validation.valid) throw new Error(validation.message);

    // API: POST /api/vc/sim/calculator/calculate
    // 보냄: { sourceType: "CALCULATOR", equipment: { fabCd, setModelNm }, chambers[].pipeList }
    // 받음: Non-BIM과 같은 결과 row 구조. normalizeCalculationResult가 공통 팝업 모델로 맞춥니다.
    const payload = buildCalculatorCalculatePayload(state);
    const response = yield call(vcSimApi.calculateVcCalculator, payload);
    const result = normalizeCalculationResult(response, payload);

    yield put(vcCalculatorActions.calculateSuccess());
    yield put(vcResultActions.openResultPopup(result));
  } catch (error) {
    yield put(vcCalculatorActions.calculateFailure(getErrorMessage(error)));
  }
}

// 결과 저장은 현재 결과 팝업에 표시된 basicInfo, rows, draft 정보를 B/E 저장 API로 보냅니다.
function* saveResultFlow() {
  try {
    const state = yield select(selectVcResultState);

    if (
      state.sourceType === "NON_BIM" &&
      hasSpecOutRows(state.rows) &&
      (!state.draftPopup.title.trim() || !state.draftPopup.attachmentName.trim())
    ) {
      // Spec Out인 Non-BIM 결과는 표준 기안 첨부 정보가 필요합니다. reducer가 팝업을 열어두었으므로 API 호출은 중단합니다.
      return;
    }

    // API: POST /api/vc/sim/result/save
    // 보냄: { sourceType, basicInfo, rows, draft }
    // 받음: 저장 ID, 저장 상태, 저장 시각 등 후속 조회에 사용할 결과 메타데이터
    const response = yield call(vcSimApi.saveVcResult, {
      sourceType: state.sourceType,
      basicInfo: state.basicInfo,
      rows: state.rows,
      draft: state.draftPopup,
    });
    yield put(vcResultActions.saveResultSuccess(response));
  } catch (error) {
    yield put(vcResultActions.saveResultFailure(getErrorMessage(error)));
  }
}

// 같은 action이 반복되면 마지막 요청만 유효하게 처리해 이전 응답이 현재 화면을 덮지 않게 합니다.
export function* watchNonBimSaga() {
  yield takeLatest(NON_BIM_ACTION_TYPES.INIT_OPTIONS_REQUEST, nonBimOptionsInitFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST, fetchEqSuggestionsFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST, fetchManualDrawingsFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST, downloadForelineFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.SELECT_DRAWING, fetchSelectedDrawingDetailsFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.CALCULATE_REQUEST, nonBimCalculateFlow);
  yield takeLatest(VC_CALCULATOR_ACTION_TYPES.INIT_REQUEST, calculatorInitFlow);
  yield takeLatest(VC_CALCULATOR_ACTION_TYPES.CALCULATE_REQUEST, vcCalculatorCalculateFlow);
  yield takeLatest(VC_RESULT_ACTION_TYPES.SAVE_RESULT_REQUEST, saveResultFlow);
}

export default function* nonBimSaga() {
  yield all([watchNonBimSaga()]);
}
