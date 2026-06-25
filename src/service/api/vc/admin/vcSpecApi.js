export const VC_SPEC_ENDPOINTS = {
  createMaster: "/api/vc/specmaster",
  selectCondition: "/api/vc/specmaster/selectcondition",
  selectFilterOptions: "/api/vc/specmaster/selectfilteroptions",
  specNameSuggestions: "/api/vc/specmaster/specnames",
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
    const error = new Error("Cannot connect to the local B/E API. Check that the B/E is running on port 8090.");
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
  selectFilterOptions() {
    return requestJson(VC_SPEC_ENDPOINTS.selectFilterOptions);
  },

  searchSpecNameSuggestions(keyword) {
    return requestJson(VC_SPEC_ENDPOINTS.specNameSuggestions, {
      params: { keyword },
    });
  },

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

  getSpec(specId) {
    return requestJson(VC_SPEC_ENDPOINTS.specById(specId));
  },

  createMaster(payload) {
    return requestJson(VC_SPEC_ENDPOINTS.createMaster, {
      method: "POST",
      body: payload,
    });
  },

  updateSpec(specId, payload) {
    return requestJson(VC_SPEC_ENDPOINTS.specById(specId), {
      method: "PATCH",
      body: payload,
    });
  },

  createChild(parentSpecId, payload) {
    return requestJson(VC_SPEC_ENDPOINTS.children(parentSpecId), {
      method: "POST",
      body: payload,
    });
  },

  getChildren(parentSpecId) {
    return requestJson(VC_SPEC_ENDPOINTS.children(parentSpecId));
  },

  deleteSpec(specId, chgchgrempno = "") {
    return requestJson(VC_SPEC_ENDPOINTS.specById(specId), {
      method: "DELETE",
      params: { chgchgrempno },
    });
  },
};

export default vcSpecApi;
