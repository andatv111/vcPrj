export const VC_SIM_ENDPOINTS = {
  //BIM/5D 미적용 Fab
  nonBimOptions: "/api/vc/sim/non-bim/options",
  searchEqSuggestions: "/api/vc/sim/non-bim/equipments",
  searchManualDrawings: "/api/vc/sim/non-bim/manual-drawings",
  drawingChambers: "/api/vc/sim/non-bim/chambers",
  downloadForelineDrawing: "/api/vc/sim/non-bim/foreline-drawing/download",
  //V/C Calculator
  calculateNonBim: "/api/vc/sim/non-bim/calculate",
  equipmentSpecOptions: "/api/vc/sim/non-bim/equipment-spec-options",
  calculatorOptions: "/api/vc/sim/calculator/options",
  calculateVcCalculator: "/api/vc/sim/calculator/calculate",
  //Vacuum Conductance Result
  saveVcResult: "/api/vc/sim/result/save",
};

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

// 실패한 Promise는 제거해 B/E가 다시 실행된 뒤 화면 새로고침으로 재시도할 수 있습니다. 즉, 화면 두번호출해도 B/E한번호출
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
