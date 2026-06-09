/**
 * V/C Simulation saga 흐름입니다.
 * 화면 action과 API adapter 사이를 연결하고, 응답은 helper에서 화면 모델로 정규화합니다.
 */
import { all, call, delay, put, select, takeLatest } from "redux-saga/effects";

import { VC_CALCULATOR_ACTION_TYPES, vcCalculatorActions } from "../../../store/vc/vcCalculator/action";
import { selectVcCalculatorState } from "../../../store/vc/vcCalculator/vcSimSelector";
import { NON_BIM_ACTION_TYPES, nonBimActions } from "../../../store/vc/nonBim/action";
import { selectDrawings, selectNonBimState, selectSearch } from "../../../store/vc/nonBim/vcSimSelector";
import { VC_RESULT_ACTION_TYPES, vcResultActions } from "../../../store/vc/vcResult/action";
import { selectVcResultState } from "../../../store/vc/vcResult/vcSimSelector";
import vcSimApi from "../../../service/api/vc/sim/vcSimApi";
import { DRAWING_STATUS } from "../../../components/vc/nonBim/core/NonBim.constant";

import {
  buildCalculatorCalculatePayload,
  buildFileDownloadName,
  buildNonBimCalculatePayload,
  downloadBlob,
  hasSpecOutRows,
  normalizeCalculationResult,
  normalizeDrawingList,
  toArray,
  validateChambersBeforeCalculate,
  validateNonBimBeforeCalculate,
} from "../../../components/vc/nonBim/core/NonBim.helper";

// 모든 saga catch에서 같은 오류 메시지 형태를 사용합니다.
const getErrorMessage = (error) => {
  if (!error) return "알 수 없는 오류가 발생했습니다.";
  if (typeof error === "string") return error;
  return error.message || error.errorMessage || "알 수 없는 오류가 발생했습니다.";
};

// EQ ID 자동완성은 마지막 입력값만 화면에 반영합니다.
function* fetchEqSuggestionsFlow(action) {
  try {
    const keyword = action.payload?.keyword || "";

    yield delay(250);

    if (!keyword || keyword.length < 2) {
      yield put(nonBimActions.fetchEqSuggestionsSuccess([]));
      return;
    }

    const response = yield call(vcSimApi.searchEqSuggestions, keyword);
    const items = toArray(response?.data || response?.list || response?.result || response).map((item) => ({
      value: item.eqId || item.equipmentId || item.value || item,
      label: item.label || item.eqId || item.equipmentId || item.value || item,
      raw: item,
    }));

    yield put(nonBimActions.fetchEqSuggestionsSuccess(items));
  } catch (error) {
    yield put(nonBimActions.fetchEqSuggestionsFailure(getErrorMessage(error)));
  }
}

// 수기 도면 조회는 현재 Redux search state를 기준으로 실행합니다.
function* fetchManualDrawingsFlow() {
  try {
    const search = yield select(selectSearch);
    const response = yield call(vcSimApi.searchManualDrawings, search);
    yield put(nonBimActions.fetchManualDrawingsSuccess(normalizeDrawingList(response)));
  } catch (error) {
    yield put(nonBimActions.fetchManualDrawingsFailure(getErrorMessage(error)));
  }
}

// 다운로드 요청은 공사번호로 선택 row를 찾은 뒤 drawingKey/fileId를 사용합니다.
function* downloadForelineFlow(action) {
  try {
    const constructionNo = action.payload?.constructionNo;
    const drawings = yield select(selectDrawings);
    const drawing = drawings.find((item) => item.constructionNo === constructionNo);

    if (!drawing) throw new Error("다운로드할 수기 도면을 찾을 수 없습니다.");

    const blob = yield call(vcSimApi.downloadForelineDrawing, {
      drawingKey: drawing.drawingKey,
      fileId: drawing.foreline?.fileId,
      constructionNo: drawing.constructionNo,
    });

    yield call(downloadBlob, blob, buildFileDownloadName(drawing));
    yield put(nonBimActions.downloadForelineSuccess());
  } catch (error) {
    yield put(nonBimActions.downloadForelineFailure(getErrorMessage(error)));
  }
}

// 도면 선택 직후 장비/모델/공사번호에 맞는 Model Standard 목록을 보강 조회합니다.
function* fetchModelStandardOptionsFlow(action) {
  try {
    const constructionNo = action.payload?.constructionNo;
    const drawings = yield select(selectDrawings);
    const drawing = drawings.find((item) => item.constructionNo === constructionNo);

    if (!drawing) return;

    const options = yield call(vcSimApi.getEquipmentSpecOptions, {
      eqId: drawing.eqId,
      fab: drawing.fab,
      model: drawing.model,
      drawingKey: drawing.drawingKey,
      constructionNo: drawing.constructionNo,
    });

    yield put(nonBimActions.fetchModelStandardOptionsSuccess({ constructionNo, options }));
  } catch (error) {
    yield put(nonBimActions.fetchModelStandardOptionsFailure(getErrorMessage(error)));
  }
}

// Non-BIM 계산은 저장 상태를 만들지 않고 공통 결과 팝업만 엽니다.
function* nonBimCalculateFlow() {
  try {
    const state = yield select(selectNonBimState);

    const validation = validateNonBimBeforeCalculate({
      selectedDrawing: state.selectedDrawing,
      chambers: state.chambers,
    });

    if (!validation.valid) throw new Error(validation.message);

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
    const response = yield call(vcSimApi.getCalculatorOptions);
    yield put(vcCalculatorActions.initSuccess(response));
  } catch (error) {
    yield put(vcCalculatorActions.initFailure(getErrorMessage(error)));
  }
}

// Calculator도 Non-BIM과 같은 결과 팝업 모델을 사용합니다.
function* vcCalculatorCalculateFlow() {
  try {
    const state = yield select(selectVcCalculatorState);

    const validation = validateChambersBeforeCalculate(state.chambers);

    if (!validation.valid) throw new Error(validation.message);

    const payload = buildCalculatorCalculatePayload(state);
    const response = yield call(vcSimApi.calculateVcCalculator, payload);
    const result = normalizeCalculationResult(response, payload);

    yield put(vcCalculatorActions.calculateSuccess());
    yield put(vcResultActions.openResultPopup(result));
  } catch (error) {
    yield put(vcCalculatorActions.calculateFailure(getErrorMessage(error)));
  }
}

// 저장 API는 향후 V/C Master 조회 대상 데이터를 저장하기 위한 흐름입니다.
function* saveResultFlow() {
  try {
    const state = yield select(selectVcResultState);

    if (
      state.sourceType === "NON_BIM" &&
      hasSpecOutRows(state.rows) &&
      (!state.draftPopup.title.trim() || !state.draftPopup.attachmentName.trim())
    ) {
      return;
    }

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

// 빠르게 반복되는 요청은 takeLatest로 마지막 요청만 유효하게 처리합니다.
export function* watchNonBimSaga() {
  yield takeLatest(NON_BIM_ACTION_TYPES.FETCH_EQ_SUGGESTIONS_REQUEST, fetchEqSuggestionsFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.FETCH_MANUAL_DRAWINGS_REQUEST, fetchManualDrawingsFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.DOWNLOAD_FORELINE_REQUEST, downloadForelineFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.SELECT_DRAWING, fetchModelStandardOptionsFlow);
  yield takeLatest(NON_BIM_ACTION_TYPES.CALCULATE_REQUEST, nonBimCalculateFlow);
  yield takeLatest(VC_CALCULATOR_ACTION_TYPES.INIT_REQUEST, calculatorInitFlow);
  yield takeLatest(VC_CALCULATOR_ACTION_TYPES.CALCULATE_REQUEST, vcCalculatorCalculateFlow);
  yield takeLatest(VC_RESULT_ACTION_TYPES.SAVE_RESULT_REQUEST, saveResultFlow);
}

export default function* nonBimSaga() {
  yield all([watchNonBimSaga()]);
}
