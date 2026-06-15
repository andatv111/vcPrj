/**
 * V/C Simulation saga flow.
 * This layer connects screen actions to vcSimApi and keeps DTO shaping inside helper functions.
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

// Keep every saga error as readable text so the UI never shows "[object Object]".
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
  const payload = response?.data || response || {};
  return {
    fabs: toArray(payload.fabs).map(normalizeOptionItem).filter((item) => item.value),
    pipeTypes: toArray(payload.pipeTypes).map(normalizeOptionItem).filter((item) => item.value),
  };
};

function* nonBimOptionsInitFlow() {
  try {
    const response = yield call(vcSimApi.getNonBimOptions);
    yield put(nonBimActions.initOptionsSuccess(normalizeScreenOptions(response)));
  } catch (error) {
    yield put(nonBimActions.initOptionsFailure(getErrorMessage(error)));
  }
}

// EQ ID autocomplete only reflects the latest keyword typed by the user.
function* fetchEqSuggestionsFlow(action) {
  try {
    // Debounce here instead of in the component so the screen stays a thin view layer.
    const keyword = action.payload?.keyword || "";

    yield delay(250);

    if (!keyword || keyword.length < 2) {
      yield put(nonBimActions.fetchEqSuggestionsSuccess([]));
      return;
    }

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

// Manual drawing search always uses the current Redux search state.
function* fetchManualDrawingsFlow() {
  try {
    const search = yield select(selectSearch);
    const response = yield call(vcSimApi.searchManualDrawings, search);
    yield put(nonBimActions.fetchManualDrawingsSuccess(normalizeDrawingList(response)));
  } catch (error) {
    yield put(nonBimActions.fetchManualDrawingsFailure(getErrorMessage(error)));
  }
}

// Download receives woId from the row, then resolves the full drawing context.
function* downloadForelineFlow(action) {
  try {
    const woId = action.payload?.woId;
    const drawings = yield select(selectDrawings);
    const drawing = drawings.find((item) => item.woId === woId);

    if (!drawing) throw new Error("Cannot find the selected drawing for download.");

    const blob = yield call(vcSimApi.downloadForelineDrawing, buildForelineDownloadParams(drawing));

    yield call(downloadBlob, blob, buildFileDownloadName(drawing));
    yield put(nonBimActions.downloadForelineSuccess());
  } catch (error) {
    yield put(nonBimActions.downloadForelineFailure(getErrorMessage(error)));
  }
}

// Selecting a drawing hydrates chamber names and model-standard options from the backend.
function* fetchSelectedDrawingDetailsFlow(action) {
  const woId = action.payload?.woId;
  const drawings = yield select(selectDrawings);
  const drawing = drawings.find((item) => item.woId === woId);

  if (!drawing) return;

  try {
    // The detail endpoint remains the source of truth even when the list already has chamber hints.
    const chamberResponse = yield call(vcSimApi.getDrawingChambers, buildEquipmentContextParams(drawing));
    const rawChambers = toArray(chamberResponse);
    const chambers = normalizeChambersFromDrawing({ ...drawing, chambers: rawChambers });
    yield put(nonBimActions.fetchDrawingChambersSuccess({ woId, chambers }));
  } catch (error) {
    yield put(nonBimActions.fetchDrawingChambersFailure(getErrorMessage(error)));
  }

  try {
    const options = yield call(vcSimApi.getEquipmentSpecOptions, buildEquipmentContextParams(drawing));
    yield put(nonBimActions.fetchModelStandardOptionsSuccess({ woId, options }));
  } catch (error) {
    yield put(nonBimActions.fetchModelStandardOptionsFailure(getErrorMessage(error)));
  }
}

// Non-BIM calculation opens the shared result popup after backend calculation succeeds.
function* nonBimCalculateFlow() {
  try {
    // Non-BIM must have a selected WO and complete chamber spec before calculation.
    const state = yield select(selectNonBimState);

    const validation = validateNonBimBeforeCalculate({
      selectedDrawing: state.selectedDrawing,
      chambers: state.chambers,
    });

    if (!validation.valid) throw new Error(validation.message);

    // Payload assembly stays in the helper so future Java DTO changes do not leak into the screen.
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
    // Calculator needs only option data; it is not tied to a selected design-portal drawing.
    const response = yield call(vcSimApi.getCalculatorOptions);
    yield put(vcCalculatorActions.initSuccess(response));
  } catch (error) {
    yield put(vcCalculatorActions.initFailure(getErrorMessage(error)));
  }
}

// Calculator uses the same result popup, but accepts specless chambers with conductance and NA judge.
function* vcCalculatorCalculateFlow() {
  try {
    // Unlike Non-BIM, Calculator must not clear/disable the calculation target when Model Standard is empty.
    const state = yield select(selectVcCalculatorState);

    const validation = validateChambersBeforeCalculate(state.chambers, { allowSpecless: true });

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

// Save persists the current result popup data for later V/C Master lookup.
function* saveResultFlow() {
  try {
    const state = yield select(selectVcResultState);

    if (
      state.sourceType === "NON_BIM" &&
      hasSpecOutRows(state.rows) &&
      (!state.draftPopup.title.trim() || !state.draftPopup.attachmentName.trim())
    ) {
      // The reducer already opened the draft popup, so stop before calling the save API.
      return;
    }

    // The save API receives exactly what the result popup displays plus draft attachment metadata.
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

// Repeated UI requests use takeLatest so stale responses cannot overwrite the current screen.
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
