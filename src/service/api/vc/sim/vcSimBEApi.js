/**
 * V/C Simulation B/E API 연동 초안.
 *
 * 이 파일은 현재 화면 검증용 mock adapter인 vcSimApi.js와 분리된 실제 B/E 연동 가이드입니다.
 * B/E가 준비되면 endpoint와 DTO를 이 계약에 맞추거나, 이 adapter를 vcSimApi.js 대신 연결하면 됩니다.
 *
 * 공통 응답 규칙
 * - JSON API는 배열 자체, 객체 자체, { data }, { result }, { list }, { data: { rows } } wrapper를 허용합니다.
 * - 운영 안정성을 위해 가능하면 { success, data, message, errorCode } 형태를 권장합니다.
 * - 오류 응답은 HTTP status와 사용자가 이해할 수 있는 message를 내려주세요.
 *
 * 주요 endpoint
 * 1. GET  /api/vc/sim/non-bim/equipments
 *    - query: { keyword }
 *    - EQ ID 자동완성 후보를 반환합니다.
 *
 * 2. GET  /api/vc/sim/non-bim/manual-drawings
 *    - query: { eqId, constructionNo, page?, size?, sort? }
 *    - 첫 번째 그리드 row 목록을 반환합니다.
 *    - 화면 PK는 constructionNo입니다.
 *    - drawingKey/drawingId는 Foreline 다운로드용 보조 키로만 사용합니다.
 *    - chamberCount와 chambers 또는 chamberList를 함께 내려주면 하단 Chamber 탭을 구성할 수 있습니다.
 *
 * 3. GET  /api/vc/sim/non-bim/foreline-drawing/download
 *    - query: { drawingKey, fileId, constructionNo }
 *    - Blob, Stream, ArrayBuffer 등 파일 body를 반환합니다.
 *    - Content-Disposition에 원본 파일명을 포함하는 것을 권장합니다.
 *
 * 4. GET  /api/vc/sim/non-bim/equipment-spec-options
 *    - query: { eqId, fab, model, drawingKey, constructionNo }
 *    - Model Standard option 배열을 반환합니다.
 *    - 각 option은 value, label, minSpec, maxSpec을 포함해야 합니다.
 *    - 적용 가능한 기준이 없으면 빈 배열을 반환하세요. F/E는 이 경우 산출대상 스위치를 off 처리합니다.
 *
 * 5. POST /api/vc/sim/non-bim/calculate
 *    - body는 buildNonBimCalculatePayload가 만드는 sourceType/equipment/chambers/pipeList 구조입니다.
 *    - chamber별 rows를 반환합니다.
 *    - 산출대상 제외 또는 Spec 미적용 row는 conductance: "N/A", judge: "NA"를 반환하는 것을 권장합니다.
 *
 * 6. GET  /api/vc/sim/calculator/options
 *    - Calculator 초기 Fab, Model, Model Standard option을 반환합니다.
 *
 * 7. POST /api/vc/sim/calculator/calculate
 *    - body는 buildCalculatorCalculatePayload가 만드는 구조입니다.
 *    - 응답 rows는 Non-BIM 계산 API와 같은 결과 팝업 모델로 정규화될 수 있어야 합니다.
 *
 * 8. POST /api/vc/sim/result/save
 *    - Vacuum Conductance 결과 저장 API입니다.
 *    - 저장 대상은 향후 V/C Master 또는 이력 화면입니다.
 *    - 이 계산 화면의 상단 그리드 Status를 저장 상태로 잠그는 용도로 사용하지 않습니다.
 *    - Spec Out Non-BIM 결과는 draft.title, draft.attachmentName 또는 실제 attachmentId를 함께 전달합니다.
 *
 * 권장 save 응답:
 * {
 *   "savedId": "VC-SAVE-001",
 *   "sourceType": "NON_BIM",
 *   "savedAt": "2026-06-07T00:00:00.000Z",
 *   "rowCount": 1,
 *   "draftAttached": true,
 *   "nextStatus": "Draft Attached"
 * }
 */

export const VC_SIM_BE_DEVELOPMENT_REQUEST = {
  common: {
    responseWrapper: '{ success, data, message, errorCode } 권장. 배열 또는 { data/list/result } wrapper도 F/E에서 흡수 가능',
    primaryKey: 'BIM/5D 미적용 Fab 첫 번째 그리드의 업무 PK는 constructionNo입니다. drawingKey/drawingId는 다운로드 보조 키입니다.',
    savePolicy: '계산 화면은 저장 상태를 다시 조회해 잠그는 화면이 아닙니다. 저장 결과는 V/C Master 또는 이력 화면에서 조회합니다.',
  },
  screens: [
    {
      name: 'BIM/5D 미적용 Fab',
      requiredApis: [
        'GET /api/vc/sim/non-bim/equipments',
        'GET /api/vc/sim/non-bim/manual-drawings',
        'GET /api/vc/sim/non-bim/equipment-spec-options',
        'GET /api/vc/sim/non-bim/foreline-drawing/download',
        'POST /api/vc/sim/non-bim/calculate',
      ],
      notes: [
        'manual-drawings 응답에는 constructionNo, eqId, fab, model, requestStatus, chamberCount를 포함해 주세요.',
        'chambers/chamberList가 있으면 해당 상세를 우선 사용하고, 없으면 chamberCount만큼 F/E가 기본 Chamber 탭을 생성합니다.',
        'Model Standard option은 value, label, minSpec, maxSpec을 포함해야 합니다.',
        '적용 가능한 Model Standard 또는 Spec이 없으면 빈 배열 또는 빈 min/max를 반환해 주세요. F/E는 산출대상을 off 처리합니다.',
      ],
    },
    {
      name: 'V/C Calculator',
      requiredApis: [
        'GET /api/vc/sim/calculator/options',
        'POST /api/vc/sim/calculator/calculate',
      ],
      notes: [
        'Calculator option은 fabs, models, modelStandards 배열로 반환해 주세요.',
        '계산 결과 rows 구조는 Non-BIM calculate 결과와 동일하게 맞춰 공통 결과 팝업을 재사용합니다.',
      ],
    },
  ],
  popups: [
    {
      name: 'Vacuum Conductance Result',
      requiredApi: 'POST calculate 응답 rows',
      rowFields: ['chamberId', 'processLarge', 'processMiddle', 'modelStandard', 'minSpec', 'maxSpec', 'conductance', 'judge', 'calculationTarget'],
      judgeRule: 'IN, HIGH_OUT, LOW_OUT, NA를 우선 사용해 주세요. 산출대상 제외 또는 Spec 미적용은 conductance=N/A, judge=NA를 권장합니다.',
    },
    {
      name: '표준 기안 첨부 팝업',
      requiredApi: 'POST /api/vc/sim/result/save',
      notes: [
        'Spec Out Non-BIM 결과 저장 시 draft.title과 attachmentName 또는 attachmentId를 전달합니다.',
        '실제 파일 업로드 방식은 별도 upload 후 attachmentId 전달 또는 multipart save 중 하나로 확정이 필요합니다.',
      ],
    },
  ],
};

export const VC_SIM_BE_ENDPOINTS = {
  searchEqSuggestions: "/api/vc/sim/non-bim/equipments",
  searchManualDrawings: "/api/vc/sim/non-bim/manual-drawings",
  downloadForelineDrawing: "/api/vc/sim/non-bim/foreline-drawing/download",
  calculateNonBim: "/api/vc/sim/non-bim/calculate",
  equipmentSpecOptions: "/api/vc/sim/non-bim/equipment-spec-options",
  calculatorOptions: "/api/vc/sim/calculator/options",
  calculateVcCalculator: "/api/vc/sim/calculator/calculate",
  saveVcResult: "/api/vc/sim/result/save",
};

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const createQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : "";
};

const unwrapJsonResponse = (payload) => {
  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    const error = new Error(payload.message || "B/E API request failed.");
    error.errorCode = payload.errorCode;
    error.details = payload.details;
    throw error;
  }

  return payload;
};

const requestJson = async (url, { method = "GET", params, body, headers } = {}) => {
  const response = await fetch(`${url}${createQueryString(params)}`, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      payload?.message || payload?.errorMessage || payload || `B/E API request failed. (${response.status})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return unwrapJsonResponse(payload);
};

const requestBlob = async (url, { params } = {}) => {
  const response = await fetch(`${url}${createQueryString(params)}`, {
    method: "GET",
  });

  if (!response.ok) {
    let message = `B/E file download failed. (${response.status})`;

    try {
      const payload = await response.json();
      message = payload?.message || payload?.errorMessage || message;
    } catch {
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.blob();
};

export const vcSimBEApi = {
  searchEqSuggestions(keyword) {
    return requestJson(VC_SIM_BE_ENDPOINTS.searchEqSuggestions, {
      params: { keyword },
    });
  },

  searchManualDrawings(params = {}) {
    return requestJson(VC_SIM_BE_ENDPOINTS.searchManualDrawings, {
      params,
    });
  },

  downloadForelineDrawing({ drawingKey, fileId, constructionNo }) {
    return requestBlob(VC_SIM_BE_ENDPOINTS.downloadForelineDrawing, {
      params: { drawingKey, fileId, constructionNo },
    });
  },

  getEquipmentSpecOptions({ eqId, fab, model, drawingKey, constructionNo }) {
    return requestJson(VC_SIM_BE_ENDPOINTS.equipmentSpecOptions, {
      params: { eqId, fab, model, drawingKey, constructionNo },
    });
  },

  calculateNonBim(payload) {
    return requestJson(VC_SIM_BE_ENDPOINTS.calculateNonBim, {
      method: "POST",
      body: payload,
    });
  },

  getCalculatorOptions() {
    return requestJson(VC_SIM_BE_ENDPOINTS.calculatorOptions);
  },

  calculateVcCalculator(payload) {
    return requestJson(VC_SIM_BE_ENDPOINTS.calculateVcCalculator, {
      method: "POST",
      body: payload,
    });
  },

  saveVcResult(payload) {
    return requestJson(VC_SIM_BE_ENDPOINTS.saveVcResult, {
      method: "POST",
      body: payload,
    });
  },
};

export default vcSimBEApi;
