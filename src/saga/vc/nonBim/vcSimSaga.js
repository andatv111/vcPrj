import { all, call, delay, put, select, takeLatest } from "redux-saga/effects";

import { VC_CALCULATOR_ACTION_TYPES, vcCalculatorActions } from "../../../store/vc/vcCalculator/action";
import { selectVcCalculatorState } from "../../../store/vc/vcCalculator/vcSimSelector";
import { NON_BIM_ACTION_TYPES, nonBimActions } from "../../../store/vc/nonBim/action";
import { selectDrawings, selectNonBimState, selectSearch } from "../../../store/vc/nonBim/vcSimSelector";
import { VC_RESULT_ACTION_TYPES, vcResultActions } from "../../../store/vc/vcResult/action";
import { selectVcResultState } from "../../../store/vc/vcResult/vcSimSelector";
import vcSimApi from "../../../service/api/vc/sim/vcSimApi";
import { DRAWING_STATUS } from "../../../components/vc/nonBim/core/NonBim.constant";

/**
 * API 연결 흐름 가이드
 *
 * saga는 화면 action과 vcSimApi 사이의 연결부입니다.
 * 실제 B/E API로 교체할 때도 화면 컴포넌트는 그대로 두고,
 * vcSimApi 호출 결과를 normalize 함수로 화면 모델에 맞춘 뒤 reducer에 저장하는 흐름을 유지하세요.
 *
 * - 조회 그리드: fetchManualDrawingsFlow -> searchManualDrawings -> normalizeDrawingList -> drawings state
 * - 결과 그리드: calculate flow -> calculation API -> normalizeCalculationResult -> vcResult popup state
 * - 공통코드/콤보: calculatorInitFlow/fetchModelStandardOptionsFlow -> option API -> reducer options/specOptions
 */
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

// saga catch 블록마다 동일한 사용자 메시지 형태를 만들기 위한 공통 변환입니다.
const getErrorMessage = (error) => {
  if (!error) return "알 수 없는 오류가 발생했습니다.";
  if (typeof error === "string") return error;
  return error.message || error.errorMessage || "알 수 없는 오류가 발생했습니다.";
};

const getSavedDrawingStatus = (response) => {
  // B/E 저장 API가 nextStatus/requestStatus/status 같은 업무 상태를 반환하면 그 값을 우선 사용합니다.
  // mock API는 draftAttached만 반환하므로, 기안 첨부 저장은 Draft Attached, 일반 최종 저장은 Saved로 매핑합니다.
  return (
    response?.nextStatus ||
    response?.requestStatus ||
    response?.status ||
    (response?.draftAttached ? DRAWING_STATUS.DRAFT_ATTACHED : DRAWING_STATUS.SAVED)
  );
};

function* fetchEqSuggestionsFlow(action) {
  // trigger action: NON_BIM/FETCH_EQ_SUGGESTIONS_REQUEST
  // success action: FETCH_EQ_SUGGESTIONS_SUCCESS
  // failure action: FETCH_EQ_SUGGESTIONS_FAILURE
  try {
    const keyword = action.payload?.keyword || "";

    // 입력할 때마다 요청이 몰리지 않도록 간단한 debounce 역할을 합니다.
    // takeLatest와 함께 쓰여 마지막 입력값 기준의 후보만 화면에 반영됩니다.
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

function* fetchManualDrawingsFlow() {
  // trigger action: NON_BIM/FETCH_MANUAL_DRAWINGS_REQUEST
  // success action: FETCH_MANUAL_DRAWINGS_SUCCESS
  // failure action: FETCH_MANUAL_DRAWINGS_FAILURE
  try {
    // 검색 조건은 action payload가 아니라 현재 Redux state에서 읽어 화면 입력값과 항상 일치시킵니다.
    const search = yield select(selectSearch);
    const response = yield call(vcSimApi.searchManualDrawings, search);
    yield put(nonBimActions.fetchManualDrawingsSuccess(normalizeDrawingList(response)));
  } catch (error) {
    yield put(nonBimActions.fetchManualDrawingsFailure(getErrorMessage(error)));
  }
}

function* downloadForelineFlow(action) {
  // trigger action: NON_BIM/DOWNLOAD_FORELINE_REQUEST
  // success action: DOWNLOAD_FORELINE_SUCCESS
  // failure action: DOWNLOAD_FORELINE_FAILURE
  try {
    const drawingId = action.payload?.drawingId;
    const drawings = yield select(selectDrawings);
    const drawing = drawings.find((item) => item.id === drawingId);

    // 화면 row에서 찾은 drawingId와 foreline fileId를 함께 넘겨 실제 파일 식별을 돕습니다.
    if (!drawing) throw new Error("다운로드할 수기 도면을 찾을 수 없습니다.");

    const blob = yield call(vcSimApi.downloadForelineDrawing, {
      drawingId: drawing.id,
      fileId: drawing.foreline?.fileId,
    });

    yield call(downloadBlob, blob, buildFileDownloadName(drawing));
    yield put(nonBimActions.downloadForelineSuccess());
  } catch (error) {
    yield put(nonBimActions.downloadForelineFailure(getErrorMessage(error)));
  }
}

function* fetchModelStandardOptionsFlow(action) {
  // trigger action: NON_BIM/SELECT_DRAWING
  // success action: FETCH_MODEL_STANDARD_OPTIONS_SUCCESS
  // failure action: FETCH_MODEL_STANDARD_OPTIONS_FAILURE
  // note: 도면 선택 자체는 reducer가 즉시 처리하고, saga는 선택 도면의 spec option만 보강합니다.
  try {
    const drawingId = action.payload?.drawingId;
    const drawings = yield select(selectDrawings);
    const drawing = drawings.find((item) => item.id === drawingId);

    if (!drawing) return;

    // 도면 선택 직후 장비/모델 기준으로 사용 가능한 Model Standard 목록을 보강합니다.
    const options = yield call(vcSimApi.getEquipmentSpecOptions, {
      eqId: drawing.eqId,
      fab: drawing.fab,
      model: drawing.model,
      drawingId: drawing.id,
    });

    yield put(nonBimActions.fetchModelStandardOptionsSuccess({ drawingId, options }));
  } catch (error) {
    yield put(nonBimActions.fetchModelStandardOptionsFailure(getErrorMessage(error)));
  }
}

function* nonBimCalculateFlow() {
  // trigger action: NON_BIM/CALCULATE_REQUEST
  // success actions: NON_BIM/CALCULATE_SUCCESS, VC_RESULT/OPEN_RESULT_POPUP
  // failure action: NON_BIM/CALCULATE_FAILURE
  try {
    const state = yield select(selectNonBimState);

    // 계산 전에는 선택 도면과 배관 필수값을 먼저 검증해 불완전한 payload 전송을 막습니다.
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
  // trigger action: VC_CALCULATOR/INIT_REQUEST
  // success action: INIT_SUCCESS
  // failure action: INIT_FAILURE
  try {
    const response = yield call(vcSimApi.getCalculatorOptions);
    yield put(vcCalculatorActions.initSuccess(response));
  } catch (error) {
    yield put(vcCalculatorActions.initFailure(getErrorMessage(error)));
  }
}

function* vcCalculatorCalculateFlow() {
  // trigger action: VC_CALCULATOR/CALCULATE_REQUEST
  // success actions: VC_CALCULATOR/CALCULATE_SUCCESS, VC_RESULT/OPEN_RESULT_POPUP
  // failure action: VC_CALCULATOR/CALCULATE_FAILURE
  try {
    const state = yield select(selectVcCalculatorState);

    // Calculator는 도면이 없으므로 Chamber/배관 필수값만 검증한 뒤 수동 입력 payload를 생성합니다.
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

function* saveResultFlow() {
  // trigger action: VC_RESULT/SAVE_RESULT_REQUEST
  // success action: SAVE_RESULT_SUCCESS
  // failure action: SAVE_RESULT_FAILURE
  // note: Spec Out 기안 첨부 필요 여부는 reducer와 saga가 같은 조건으로 방어합니다.
  try {
    const state = yield select(selectVcResultState);

    // Non-BIM에서 Spec Out이 있는데 기안 첨부 정보가 없으면 reducer가 팝업을 열고 saga 저장은 중단합니다.
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

    if (state.sourceType === "NON_BIM") {
      const nonBimState = yield select(selectNonBimState);

      if (nonBimState.selectedDrawingId) {
        // 저장/기안 첨부 성공 후 Manual Drawing Results의 Status를 갱신합니다.
        // 실제 B/E 저장 API는 저장 성공 응답에 nextStatus 또는 requestStatus를 내려주고,
        // 재조회 API도 같은 상태를 내려주면 화면은 Status만 보고 Calculate 노출을 판단할 수 있습니다.
        yield put(
          nonBimActions.updateDrawingStatus({
            drawingId: nonBimState.selectedDrawingId,
            requestStatus: getSavedDrawingStatus(response),
            savedInfo: response,
          })
        );
      }
    }

    yield put(vcResultActions.saveResultSuccess(response));
  } catch (error) {
    yield put(vcResultActions.saveResultFailure(getErrorMessage(error)));
  }
}

export function* watchNonBimSaga() {
  // takeLatest는 같은 요청이 빠르게 반복될 때 마지막 요청만 유효하게 처리합니다.
  // 검색/계산처럼 화면 입력에 민감한 흐름에서 오래된 응답이 화면을 덮어쓰는 문제를 줄입니다.
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
