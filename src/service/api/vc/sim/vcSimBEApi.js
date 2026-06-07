/**
 * V/C Simulation B/E API 연결 초안.
 *
 * 이 파일은 현재 mock 전용 어댑터인 vcSimApi.js와 의도적으로 분리되어 있습니다.
 * 현재는 B/E가 없기 때문에 vcSimApi.js가 화면 검증용 데이터를 제공하고 있으며,
 * 실제 B/E API가 준비되면 F/E가 기대하는 요청/응답 구조를 이 파일 기준으로
 * 협의하거나 교체할 수 있도록 작성했습니다.
 *
 * ---------------------------------------------------------------------------
 * F/E에서 B/E 개발자에게 요청하는 개발 요청서
 * ---------------------------------------------------------------------------
 *
 * 1. 공통 API 계약
 * - VC_SIM_BE_ENDPOINTS에 정의된 경로 기준으로 JSON API를 제공해 주세요.
 * - 일반 JSON 응답은 원본 배열/객체 그대로이거나 { data }, { result },
 *   { list }, { data: { rows } } 형태여도 F/E에서 처리할 수 있습니다.
 *   다만 운영 안정성을 위해 아래처럼 일관된 wrapper를 권장합니다.
 *
 *   {
 *     "success": true,
 *     "data": { ... },
 *     "message": "",
 *     "errorCode": ""
 *   }
 *
 * - 오류 응답은 오류 성격에 맞는 HTTP status를 내려주시고, 사용자가 이해할 수
 *   있는 message를 포함해 주세요.
 *
 *   {
 *     "success": false,
 *     "message": "Calculation input is invalid.",
 *     "errorCode": "VC_SIM_INVALID_INPUT",
 *     "details": { ... optional validation detail ... }
 *   }
 *
 * - 현재 F/E saga는 error.message, error.errorMessage 또는 문자열 오류를
 *   표시할 수 있습니다. 위 wrapper를 사용하면 아래 어댑터가 message를
 *   Error.message로 변환하므로 화면/saga/reducer 코드는 그대로 둘 수 있습니다.
 *
 * 2. 장비 자동완성 API
 * - 엔드포인트: GET /api/vc/sim/non-bim/equipments
 * - 쿼리:
 *
 *   {
 *     "keyword": "EQ-VAC"
 *   }
 *
 * - 기대 응답 data: 장비 후보 배열.
 * - 필수 또는 권장 필드:
 *
 *   [
 *     {
 *       "eqId": "EQ-VAC-ETCH-1001",
 *       "equipmentId": "EQ-VAC-ETCH-1001",
 *       "constructionNo": "VC-2026-ETCH-001",
 *       "label": "EQ-VAC-ETCH-1001 (P3 / ETCH)",
 *       "fab": "P3",
 *       "area1": "ETCH",
 *       "area2": "BAY-12"
 *     }
 *   ]
 *
 * - F/E는 각 항목을 { value, label, raw }로 정규화합니다. 따라서 eqId,
 *   equipmentId, value 중 하나는 반드시 내려와야 합니다.
 *
 * 3. 수기 도면 조회 API
 * - 엔드포인트: GET /api/vc/sim/non-bim/manual-drawings
 * - 쿼리:
 *
 *   {
 *     "eqId": "EQ-VAC-ETCH-1001",
 *     "constructionNo": "VC-2026-ETCH-001",
 *     "page": 1,
 *     "size": 50,
 *     "sort": "registeredAt,desc"
 *   }
 *
 * - 기대 응답 data: 도면 row 배열 또는 목록을 포함한 paging 객체.
 *   F/E는 data/list/result wrapper를 이미 읽을 수 있습니다.
 * - 사용자가 선택한 도면 row로 chamber/spec/foreline 데이터를 초기화하므로,
 *   장비와 도면의 기본 context를 한 응답에 포함해 주세요.
 * - 권장 row 필드:
 *
 *   {
 *     "id": "DWG-ETCH-001",
 *     "manualDrawingId": "DWG-ETCH-001",
 *     "constructionNo": "VC-2026-ETCH-001",
 *     "eqId": "EQ-VAC-ETCH-1001",
 *     "site": "Pyeongtaek",
 *     "fab": "P3",
 *     "area1": "ETCH",
 *     "area2": "BAY-12",
 *     "changeType": "New Install",
 *     "equipmentType": "Etcher",
 *     "requestStatus": "Ready",
 *     "model": "VX-ETCH-300",
 *     "mainMaker": "HanVac Systems",
 *     "processLarge": "ETCH",
 *     "processMiddle": "Metal Etch",
 *     "chamberCount": 3,
 *     "specOptions": [
 *       {
 *         "value": "ETCH-LINE-A",
 *         "label": "ETCH-LINE-A / General",
 *         "minSpec": "35",
 *         "maxSpec": "72"
 *       }
 *     ],
 *     "chambers": [
 *       {
 *         "chamberId": "CH-ETCH-A",
 *         "chamberName": "Ch01 Main Process",
 *         "modelStandard": "ETCH-LINE-A",
 *         "minSpec": "35",
 *         "maxSpec": "72",
 *         "processLarge": "ETCH",
 *         "processMiddle": "Metal Etch",
 *         "pipeRows": [
 *           {
 *             "pipeType": "PIPE",
 *             "inletDia": "4",
 *             "pipeLength": "1200",
 *             "qty": "1"
 *           }
 *         ]
 *       }
 *     ],
 *     "foreline": {
 *       "categoryName": "Foreline P&ID",
 *       "registeredAt": "2026-05-28",
 *       "registeredBy": "K. Lee",
 *       "fileId": "FILE-001",
 *       "fileName": "EQ-VAC-ETCH-1001_foreline_revA.pdf"
 *     }
 *   }
 *
 * - F/E에는 Java/MyBatis 스타일 이름에 대한 alias 처리가 이미 있습니다.
 *   예: fabCd, areaCd, dareaCd, chCnt, chamberList, specList,
 *   forelineFileId, pipeList, pipeType, inletDia, outletDia, pipeLength, qty.
 *   그래도 위 권장 필드명을 사용하면 mapping 모호성이 줄어듭니다.
 *
 * 4. Foreline 도면 다운로드 API
 * - 엔드포인트: GET /api/vc/sim/non-bim/foreline-drawing/download
 * - 쿼리:
 *
 *   {
 *     "drawingId": "DWG-ETCH-001",
 *     "fileId": "FILE-001"
 *   }
 *
 * - 기대 응답: Blob, stream 또는 binary file.
 * - Content-Type과 원본 파일명을 포함한 Content-Disposition을 설정해 주세요.
 *   F/E는 받은 Blob을 기존 다운로드 helper에 전달할 수 있으므로 화면 코드는
 *   변경하지 않아도 됩니다.
 *
 * 5. Model Standard/Spec 옵션 API
 * - 엔드포인트: GET /api/vc/sim/non-bim/equipment-spec-options
 * - 쿼리:
 *
 *   {
 *     "eqId": "EQ-VAC-ETCH-1001",
 *     "fab": "P3",
 *     "model": "VX-ETCH-300",
 *     "drawingId": "DWG-ETCH-001"
 *   }
 *
 * - 기대 응답 data: 배열.
 *
 *   [
 *     {
 *       "value": "ETCH-LINE-A",
 *       "label": "ETCH-LINE-A / General",
 *       "modelStandard": "ETCH-LINE-A",
 *       "minSpec": "35",
 *       "maxSpec": "72"
 *     }
 *   ]
 *
 * - 적용 가능한 spec이 없으면 빈 배열을 내려주세요. F/E는 spec 부재를
 *   "제약 없음"으로 처리하며, 별도의 업무 정책이 확정되기 전까지 강제
 *   "Spec Skip" 옵션은 필요하지 않습니다.
 *
 * 6. Non-BIM 계산 API
 * - 엔드포인트: POST /api/vc/sim/non-bim/calculate
 * - 요청 본문은 NonBim.helper.js의 buildNonBimCalculatePayload에서 생성합니다.
 *
 *   {
 *     "sourceType": "NON_BIM",
 *     "manualDrawingId": "DWG-ETCH-001",
 *     "search": {
 *       "eqId": "EQ-VAC-ETCH-1001",
 *       "constructionNo": "VC-2026-ETCH-001"
 *     },
 *     "equipment": {
 *       "eqId": "EQ-VAC-ETCH-1001",
 *       "constructionNo": "VC-2026-ETCH-001",
 *       "site": "Pyeongtaek",
 *       "fab": "P3",
 *       "area1": "ETCH",
 *       "area2": "BAY-12",
 *       "model": "VX-ETCH-300",
 *       "modelStandard": "ETCH-LINE-A",
 *       "mainMaker": "HanVac Systems",
 *       "processLarge": "ETCH",
 *       "processMiddle": "Metal Etch"
 *     },
 *     "chambers": [
 *       {
 *         "seq": 1,
 *         "chamberId": "CH-ETCH-A",
 *         "chamberName": "Ch01 Main Process",
 *         "modelStandard": "ETCH-LINE-A",
 *         "minSpec": "35",
 *         "maxSpec": "72",
 *         "isSpecSkipped": false,
 *         "processLarge": "ETCH",
 *         "processMiddle": "Metal Etch",
 *         "pipeList": [
 *           {
 *             "seq": 1,
 *             "type": "PIPE",
 *             "inletDiameter": "4",
 *             "length": "1200",
 *             "angle": "",
 *             "outletDiameter": "",
 *             "quantity": "1"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * - 현재 F/E에서 사용하는 pipe type 값: PIPE, ELBOW, REDUCER.
 * - 계산 결과는 chamber 단위 row로 내려주시면 됩니다. 권장 응답:
 *
 *   {
 *     "data": {
 *       "eqId": "EQ-VAC-ETCH-1001",
 *       "fab": "P3",
 *       "model": "ETCH-LINE-A",
 *       "rows": [
 *         {
 *           "id": "RESULT-001",
 *           "resultId": "RESULT-001",
 *           "chamberId": "CH-ETCH-A",
 *           "chamberName": "Ch01 Main Process",
 *           "confirmFlag": "N",
 *           "processLarge": "ETCH",
 *           "processMiddle": "Metal Etch",
 *           "modelStandard": "ETCH-LINE-A",
 *           "minSpec": "35",
 *           "maxSpec": "72",
 *           "conductance": "51.24",
 *           "judge": "IN"
 *         }
 *       ]
 *     }
 *   }
 *
 * - F/E가 이해하는 judge 값: IN, SPEC_IN, HIGH_OUT, LOW_OUT, PENDING, NONE.
 *   가능하면 IN, HIGH_OUT, LOW_OUT, NONE을 우선 사용해 주세요.
 * - 중요: model/modelStandard는 사용자가 선택한 model standard와 일관되게
 *   반환해 주세요. 결과 popup의 MODEL은 base equipment model만이 아니라
 *   선택된 model standard가 있으면 그 값을 기준으로 표시합니다.
 *
 * 7. 독립 Calculator 옵션 API
 * - 엔드포인트: GET /api/vc/sim/calculator/options
 * - 기대 응답:
 *
 *   {
 *     "fabs": [{ "value": "P3", "label": "P3" }],
 *     "models": [{ "value": "VX-ETCH-300", "label": "VX-ETCH-300" }],
 *     "modelStandards": [
 *       {
 *         "value": "ETCH-LINE-A",
 *         "label": "ETCH-LINE-A / General",
 *         "minSpec": "35",
 *         "maxSpec": "72"
 *       }
 *     ]
 *   }
 *
 * 8. 독립 Calculator 계산 API
 * - 엔드포인트: POST /api/vc/sim/calculator/calculate
 * - 요청 본문은 NonBim.helper.js의 buildCalculatorCalculatePayload에서 생성합니다.
 * - F/E가 공통 결과 popup을 재사용할 수 있도록 Non-BIM 계산과 동일한 결과
 *   구조로 반환해 주세요.
 *
 * 9. V/C 결과 저장 API
 * - 엔드포인트: POST /api/vc/sim/result/save
 * - 요청 본문:
 *
 *   {
 *     "sourceType": "NON_BIM",
 *     "basicInfo": {
 *       "eqId": "EQ-VAC-ETCH-1001",
 *       "fab": "P3",
 *       "model": "ETCH-LINE-A",
 *       "constructionNo": "VC-2026-ETCH-001"
 *     },
 *     "rows": [
 *       {
 *         "chamberId": "CH-ETCH-A",
 *         "chamberName": "Ch01 Main Process",
 *         "modelStandard": "ETCH-LINE-A",
 *         "minSpec": "35",
 *         "maxSpec": "72",
 *         "conductance": "51.24",
 *         "judge": "IN",
 *         "confirmFlag": "N"
 *       }
 *     ],
 *     "draft": {
 *       "title": "Spec out review request",
 *       "attachmentName": "review.pdf"
 *     }
 *   }
 *
 * - draft는 주로 Non-BIM 결과에 HIGH_OUT 또는 LOW_OUT row가 있을 때 사용합니다.
 * - 권장 응답:
 *
 *   {
 *     "savedId": "VC-SAVE-001",
 *     "sourceType": "NON_BIM",
 *     "savedAt": "2026-06-07T00:00:00.000Z",
 *     "rowCount": 1,
 *     "draftAttached": true
 *   }
 *
 * 10. F/E 연동 계획
 * - B/E가 준비되면 saga import를 vcSimApi에서 이 adapter로 바꾸거나,
 *   계약 확인 후 이 adapter를 vcSimApi로 교체하는 방식으로 전환할 수 있습니다.
 * - method 이름과 DTO 필드가 호환되면 기존 화면/reducer 로직은 변경하지
 *   않아도 됩니다.
 */

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
      // Binary 다운로드 실패 응답에는 JSON body가 없을 수 있습니다.
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

  downloadForelineDrawing({ drawingId, fileId }) {
    return requestBlob(VC_SIM_BE_ENDPOINTS.downloadForelineDrawing, {
      params: { drawingId, fileId },
    });
  },

  getEquipmentSpecOptions({ eqId, fab, model, drawingId }) {
    return requestJson(VC_SIM_BE_ENDPOINTS.equipmentSpecOptions, {
      params: { eqId, fab, model, drawingId },
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
