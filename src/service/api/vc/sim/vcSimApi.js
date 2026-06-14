/**
 * V/C Simulation B/E API runtime adapter.
 *
 * React saga는 vcSimApi.js의 HTTP 함수만 호출합니다.
 * 로컬 개발에서는 vite.config.js의 /api proxy가 별도 Eclipse의 Spring Boot 8090으로 요청을 넘깁니다.
 * 추후 B/E 파라미터가 추가되면 VC_SIM_ENDPOINTS와 각 함수의 params/body 조립부만 확장하고,
 * 화면 컴포넌트와 saga는 그대로 유지하는 것을 기준으로 합니다.
 *
 * V/C Simulation 단일 B/E API adapter.
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
 *    - query: { fab?, eqId, constructionNo?, page?, size?, sort? }
 *    - 첫 번째 그리드 row 목록을 반환합니다.
 *    - 화면 PK는 constructionNo입니다.
 *    - drawingKey/drawingId는 Foreline 다운로드용 보조 키로만 사용합니다.
 *    - chamberCount와 chambers 또는 chamberList를 함께 내려주면 하단 Chamber 탭을 구성할 수 있습니다.
 *
 * 3. GET  /api/vc/sim/non-bim/foreline-drawing/download
 *    - query: { eqId, constructionNo, drawingKey?, fileId?, fab? }
 *    - Blob, Stream, ArrayBuffer 등 파일 body를 반환합니다.
 *    - Content-Disposition에 원본 파일명을 포함하는 것을 권장합니다.
 *
 * 4. GET  /api/vc/sim/non-bim/chambers
 *    - query: { eqId, constructionNo }
 *    - radio 선택 도면의 실제 Chamber 배열을 반환합니다.
 *    - 기존 탭명은 chamberName을 그대로 사용하고, 사용자가 Add한 탭만 CHAMBER{순번}을 사용합니다.
 *
 * 5. GET  /api/vc/sim/non-bim/equipment-spec-options
 *    - query: { eqId, fab?, model?, drawingKey?, constructionNo? }
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
 *
 * B/E 협업 팁
 * - 먼저 화면 단위로 회의하세요: "BIM/5D 미적용 Fab", "V/C Calculator", "Vacuum Conductance Result", "표준 기안 첨부".
 * - 각 API마다 request sample, response sample, 빈 값 정책, 오류 message 정책을 1개씩 확정하면 F/E 전환이 빠릅니다.
 * - F/E가 constructionNo를 첫 그리드 업무 키로 쓰므로, B/E도 조회/저장/재조회 대화에서 같은 키를 기준으로 설명해 주세요.
 * - save 응답의 nextStatus와 manual-drawings 재조회 requestStatus가 같은 의미인지 꼭 맞춰야 합니다.
 */

export const VC_SIM_DEVELOPMENT_REQUEST = {
  common: {
    responseWrapper: '{ success, data, message, errorCode } 권장. 배열 또는 { data/list/result } wrapper도 F/E에서 흡수 가능',
    primaryKey: 'BIM/5D 미적용 Fab 첫 번째 그리드의 업무 PK는 constructionNo입니다. drawingKey/drawingId는 다운로드 보조 키입니다.',
    savePolicy: '계산 화면은 저장 상태를 다시 조회해 잠그는 화면이 아닙니다. 저장 결과는 V/C Master 또는 이력 화면에서 조회합니다.',
    communicationTip: '회의는 endpoint 목록보다 화면 workflow 기준으로 진행하세요. 사용자가 누르는 버튼, 필요한 request, 기대 response, 실패 message를 한 줄씩 맞추면 누락이 줄어듭니다.',
  },
  communicationTips: [
    'manual-drawings 조회 응답 sample을 먼저 받아 F/E normalizeDrawing alias와 맞춥니다.',
    'calculate 응답 rows sample은 IN, HIGH_OUT, LOW_OUT, NA 케이스를 모두 포함해 주세요.',
    'Spec Out 저장은 파일 업로드를 별도 API로 할지, save API를 multipart로 받을지 먼저 결정해야 합니다.',
    '저장 성공 후 nextStatus를 내려준다면, 재조회 API의 requestStatus도 같은 값/의미로 내려와야 합니다.',
    'B/E 오류 message는 alert/inline error에 그대로 노출될 수 있으므로 사용자가 이해할 문장으로 내려주세요.',
  ],
  uiIntegrationNotes: [
    'BIM/5D 미적용Fab 조회조건은 fab(optional), eqId(required), constructionNo(optional)입니다.',
    'Foreline 다운로드는 eqId와 constructionNo를 필수로 받고 drawingKey/fileId/fab 및 추가 파라미터는 보조키로 확장 가능해야 합니다.',
    'Chamber 수 산정과 Model Standard/Min/Max Spec 조회의 장비 기준 키는 eqId입니다. 추가 키가 생기면 F/E helper.buildEquipmentContextParams에만 반영할 계획입니다.',
    'VCW_VC_SPEC_MST의 FAB_ID는 FAB 콤보 및 Spec 기준 필터링 후보입니다.',
    '설계포탈 상단 그리드 조회 쿼리는 B/E팀 설계포탈 조회 쿼리 확정 후 manual-drawings 응답 DTO에 맞춰 alias를 조정합니다.',
  ],
  screens: [
    {
      name: 'BIM/5D 미적용 Fab',
      requiredApis: [
        'GET /api/vc/sim/non-bim/equipments',
        'GET /api/vc/sim/non-bim/manual-drawings',
        'GET /api/vc/sim/non-bim/chambers',
        'GET /api/vc/sim/non-bim/equipment-spec-options',
        'GET /api/vc/sim/non-bim/foreline-drawing/download',
        'POST /api/vc/sim/non-bim/calculate',
      ],
      notes: [
        'manual-drawings 응답에는 constructionNo, eqId, fab, model, requestStatus, chamberCount를 포함해 주세요.',
        'radio 선택 시 chambers API의 chamberName을 기존 탭 표시명으로 사용합니다. F/E Add 탭만 CHAMBER{순번}으로 생성합니다.',
        'Model Standard option은 value, label, minSpec, maxSpec을 포함해야 합니다.',
        '적용 가능한 Model Standard 또는 Spec이 없으면 빈 배열 또는 빈 min/max를 반환해 주세요. F/E는 산출대상을 off 처리합니다.',
        'requestStatus는 Calculate 버튼 노출 판단에 쓰입니다. Saved, Draft Attached처럼 잠금 상태가 늘어나면 F/E 상수에도 공유가 필요합니다.',
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
        'save 응답에는 savedId, savedAt, rowCount, draftAttached, nextStatus를 포함하면 F/E 후속 처리와 사용자 안내가 쉬워집니다.',
      ],
    },
  ],
};

export const VC_SIM_ENDPOINTS = {
  nonBimOptions: "/api/vc/sim/non-bim/options",
  searchEqSuggestions: "/api/vc/sim/non-bim/equipments",
  searchManualDrawings: "/api/vc/sim/non-bim/manual-drawings",
  drawingChambers: "/api/vc/sim/non-bim/chambers",
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

// React StrictMode의 개발용 재마운트에서도 화면 초기 옵션 요청은 같은 Promise를 공유합니다.
// 실패한 Promise는 제거해 B/E가 다시 실행된 뒤 화면 새로고침으로 재시도할 수 있습니다.
const optionRequestCache = new Map();

const requestCachedOptions = (cacheKey, request) => {
  if (!optionRequestCache.has(cacheKey)) {
    const promise = request().catch((error) => {
      optionRequestCache.delete(cacheKey);
      throw error;
    });
    optionRequestCache.set(cacheKey, promise);
  }

  return optionRequestCache.get(cacheKey);
};

const createQueryString = (params = {}) => {
  // undefined/null/빈 문자열은 query에서 제외해 B/E에서 불필요한 빈 조건을 받지 않게 합니다.
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
  // 권장 wrapper { success: false, message, errorCode }를 표준 Error로 변환해 saga catch에서 동일하게 처리합니다.
  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    const error = new Error(payload.message || "B/E API request failed.");
    error.errorCode = payload.errorCode;
    error.details = payload.details;
    throw error;
  }

  return payload;
};

const requestJson = async (url, { method = "GET", params, body, headers } = {}) => {
  // JSON API 공통 요청 함수입니다. 실제 프로젝트의 인증 header, CSRF token, baseUrl은 여기에서 주입하면 됩니다.
  let response;

  try {
    response = await fetch(`${url}${createQueryString(params)}`, {
      method,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const error = new Error("B/E API에 연결할 수 없습니다. Eclipse/STS에서 B/E가 8090 포트로 실행 중인지 확인해 주세요.");
    error.cause = cause;
    throw error;
  }

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
  // 파일 다운로드는 JSON wrapper가 아니라 Blob을 반환합니다. 오류 body가 JSON이면 message만 추출합니다.
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

export const vcSimApi = {
  getNonBimOptions() {
    // BIM/5D 조회조건과 Pipe Grid 콤보 데이터는 B/E 화면 옵션 API에서 조회합니다.
    return requestCachedOptions("nonBimOptions", () => requestJson(VC_SIM_ENDPOINTS.nonBimOptions));
  },

  searchEqSuggestions(keyword) {
    // EQ ID 자동완성: keyword 2글자 이상일 때 saga에서 호출합니다.
    return requestJson(VC_SIM_ENDPOINTS.searchEqSuggestions, {
      params: { keyword },
    });
  },

  searchManualDrawings(params = {}) {
    // Manual Drawing Results 조회: eqId/constructionNo 조건과 향후 paging 조건을 query로 전달합니다.
    return requestJson(VC_SIM_ENDPOINTS.searchManualDrawings, {
      params,
    });
  },

  getDrawingChambers({ eqId, constructionNo }) {
    // Manual Drawing Results radio 선택 시 실제 설비 Chamber명과 상세를 다시 조회합니다.
    return requestJson(VC_SIM_ENDPOINTS.drawingChambers, {
      params: { eqId, constructionNo },
    });
  },

  downloadForelineDrawing({ eqId, constructionNo, drawingKey, fileId, fab, ...extraParams }) {
    // Foreline 다운로드: eqId+constructionNo는 필수 업무키이고 drawingKey/fileId/fab/추가키는 보조 조회값입니다.
    return requestBlob(VC_SIM_ENDPOINTS.downloadForelineDrawing, {
      params: { eqId, constructionNo, drawingKey, fileId, fab, ...extraParams },
    });
  },

  getEquipmentSpecOptions({ eqId, fab, model, drawingKey, constructionNo, ...extraParams }) {
    // 장비 기준 Model Standard/Spec 후보 조회입니다. 키가 늘면 helper.buildEquipmentContextParams에서 함께 확장합니다.
    return requestJson(VC_SIM_ENDPOINTS.equipmentSpecOptions, {
      params: { eqId, fab, model, drawingKey, constructionNo, ...extraParams },
    });
  },

  calculateNonBim(payload) {
    // Non-BIM 계산: buildNonBimCalculatePayload 결과를 그대로 전달합니다.
    return requestJson(VC_SIM_ENDPOINTS.calculateNonBim, {
      method: "POST",
      body: payload,
    });
  },

  getCalculatorOptions() {
    // Calculator 초기 공통코드 조회입니다.
    return requestCachedOptions("calculatorOptions", () => requestJson(VC_SIM_ENDPOINTS.calculatorOptions));
  },

  calculateVcCalculator(payload) {
    // Calculator 계산: 결과 rows는 Non-BIM 계산 결과와 같은 모델로 맞추는 것이 핵심입니다.
    return requestJson(VC_SIM_ENDPOINTS.calculateVcCalculator, {
      method: "POST",
      body: payload,
    });
  },

  saveVcResult(payload) {
    // 결과 저장: Spec Out Non-BIM이면 draft 정보 또는 attachmentId가 함께 들어옵니다.
    return requestJson(VC_SIM_ENDPOINTS.saveVcResult, {
      method: "POST",
      body: payload,
    });
  },
};

export default vcSimApi;
