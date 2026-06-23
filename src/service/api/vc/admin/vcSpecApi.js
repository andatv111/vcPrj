export const VC_SPEC_ENDPOINTS = {
  createMaster: "/api/vc/specmaster",
  selectCondition: "/api/vc/specmaster/selectcondition",
  selectFilterOptions: "/api/vc/specmaster/selectfilteroptions",
  specById: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}`,
  children: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}/children`,
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

const unwrapResponse = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.success === false) {
    const error = new Error(payload.message || "Spec Master API request failed.");
    error.payload = payload;
    throw error;
  }
  if ("data" in payload && (payload.statusCode || payload.status || payload.message)) return payload.data;
  return payload;
};

const toErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload || fallback;
  if (payload.message) return payload.message;
  if (payload.errorMessage) return payload.errorMessage;
  try {
    return JSON.stringify(payload);
  } catch {
    return fallback;
  }
};

const requestJson = async (url, { method = "GET", params, body } = {}) => {
  let response;

  try {
    response = await fetch(`${url}${createQueryString(params)}`, {
      method,
      headers: DEFAULT_HEADERS,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const error = new Error("B/E API에 연결할 수 없습니다. 로컬 B/E가 8090 포트에서 실행 중인지 확인해 주세요.");
    error.cause = cause;
    throw error;
  }

  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(toErrorMessage(payload, `Spec Master API request failed. (${response.status})`));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return unwrapResponse(payload);
};

export const vcSpecApi = {
  // 메인 화면 상단 콤보와 저장 팝업 콤보 후보를 가져오는 전용 API입니다.
  // grid 조회 API와 분리해 조회 버튼을 눌러도 콤보 후보가 현재 조회 결과로 줄어들지 않게 합니다.
  selectFilterOptions() {
    return requestJson(VC_SPEC_ENDPOINTS.selectFilterOptions);
  },

  // Spec Master 메인 로딩과 조회 버튼에서 쓰는 grid 조회 API입니다.
  // GoodDocs 기준에 맞춰 POST /selectcondition으로 Master 전체와 선택 Master의 Detail을 함께 받습니다.
  selectCondition({ search, selectedSpecId, selectedDetailSpecId }) {
    return requestJson(VC_SPEC_ENDPOINTS.selectCondition, {
      method: "POST",
      body: {
        tabId: "SPEC_MASTER",
        fabId: search.fabId,
        setModelNm: search.setModelNm,
        specNm: search.specNm,
        selectedSpecId,
        selectedDetailSpecId,
      },
    });
  },

  // 수정 팝업을 열 때 grid row만 믿지 않고 B/E 단건 조회로 최신 값을 다시 확인합니다.
  getSpec(specId) {
    return requestJson(VC_SPEC_ENDPOINTS.specById(specId));
  },

  // Master Grid 상단 신규 버튼에서 Spec Master 상위 row를 등록합니다.
  createMaster(payload) {
    return requestJson(VC_SPEC_ENDPOINTS.createMaster, {
      method: "POST",
      body: payload,
    });
  },

  // Master와 Detail row 수정은 같은 PATCH endpoint를 사용합니다.
  updateSpec(specId, payload) {
    return requestJson(VC_SPEC_ENDPOINTS.specById(specId), {
      method: "PATCH",
      body: payload,
    });
  },

  // Detail Grid 상단 신규 버튼에서 선택 Master 아래의 상세 Spec을 등록합니다.
  createChild(parentSpecId, payload) {
    return requestJson(VC_SPEC_ENDPOINTS.children(parentSpecId), {
      method: "POST",
      body: payload,
    });
  },

  // 우측 Detail Grid를 선택 Master 기준으로 별도 갱신해야 할 때 사용하는 조회 API입니다.
  getChildren(parentSpecId) {
    return requestJson(VC_SPEC_ENDPOINTS.children(parentSpecId));
  },

  // 삭제 시 B/E 계약에 맞춰 변경자 사번을 chgchgrempno query parameter로 보냅니다.
  deleteSpec(specId, chgchgrempno = "") {
    return requestJson(VC_SPEC_ENDPOINTS.specById(specId), {
      method: "DELETE",
      params: { chgchgrempno },
    });
  },
};

export default vcSpecApi;
