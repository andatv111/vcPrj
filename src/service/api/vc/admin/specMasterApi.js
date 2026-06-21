export const SPEC_MASTER_ENDPOINTS = {
  createMaster: "/api/vc/specmaster",
  search: "/api/vc/specmaster/search",
  filterOptions: "/api/vc/specmaster/selectfilteroptions",
  specById: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}`,
  children: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}/children`,
  fabCommonCodes: "/api/commcode/comm-code-list",
  legacySpecs: "/api/vc/specs",
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

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.rows)) return value.rows;
  if (Array.isArray(value.content)) return value.content;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.list)) return value.list;
  return [value];
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

const requestJsonFallback = async (primary, fallback) => {
  try {
    return await primary();
  } catch (error) {
    if (typeof fallback !== "function") throw error;
    return fallback(error);
  }
};

export const specMasterApi = {
  getFilterOptions(params = {}) {
    return Promise.all([
      requestJson(SPEC_MASTER_ENDPOINTS.fabCommonCodes, {
        params: { mstCd: "VC_FAB_ID", sysId: "VC" },
      }),
      requestJsonFallback(
        () => requestJson(SPEC_MASTER_ENDPOINTS.filterOptions, { params }),
        () =>
          requestJson(SPEC_MASTER_ENDPOINTS.legacySpecs, {
            params: { fabId: params.fabId || "M16" },
          }).then((rows) => ({ rows }))
      ).catch(() => ({ rows: [] })),
    ]).then(([fabCodes, filterOptions]) => ({
      ...filterOptions,
      fabIds: toArray(fabCodes),
      fallbackFabIds: toArray(filterOptions?.fabIds),
    }));
  },

  search({ search, page, selectedSpecId, selectedDetailSpecId }) {
    return requestJson(SPEC_MASTER_ENDPOINTS.search, {
      method: "POST",
      body: {
        page: page.page,
        size: page.size,
        fabId: search.fabId,
        setModelNm: search.setModelNm,
        specNm: search.specNm,
        selectedSpecId,
        selectedDetailSpecId,
      },
    });
  },

  getChildren(parentSpecId) {
    return requestJson(SPEC_MASTER_ENDPOINTS.children(parentSpecId));
  },

  createMaster(payload) {
    return requestJson(SPEC_MASTER_ENDPOINTS.createMaster, {
      method: "POST",
      body: payload,
    });
  },

  updateSpec(specId, payload) {
    return requestJson(SPEC_MASTER_ENDPOINTS.specById(specId), {
      method: "PATCH",
      body: payload,
    });
  },

  createChild(parentSpecId, payload) {
    return requestJson(SPEC_MASTER_ENDPOINTS.children(parentSpecId), {
      method: "POST",
      body: payload,
    });
  },

  deleteSpec(specId) {
    return requestJson(SPEC_MASTER_ENDPOINTS.specById(specId), {
      method: "DELETE",
    });
  },
};

export default specMasterApi;
