export const SPEC_MASTER_ENDPOINTS = {
  createMaster: "/api/vc/specmaster",
  searchMaster: "/api/vc/specmaster/selectleftpaging",
  searchByCondition: "/api/vc/specmaster/selectcondition",
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

// 회사 B/E 응답 샘플이 아직 확정되지 않았으므로 배열, data, rows, content 같은
// 흔한 wrapper를 모두 배열로 풀어 saga normalize 단계가 흔들리지 않게 한다.
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
    // GoodDocs 기준상 FAB는 SpecMaster 옵션 API가 아니라 회사 공통코드 API가 원천이다.
    // 따라서 FAB 공통코드는 항상 별도로 호출하고, selectfilteroptions는 MODEL/SPEC/공정 후보 보강용으로 쓴다.
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
      // GoodDocs 기준: FAB 콤보는 회사 공통코드 API를 원천으로 사용한다.
      fabIds: toArray(fabCodes),
      fallbackFabIds: toArray(filterOptions?.fabIds),
    }));
  },

  searchMaster({ search, page }) {
    const params = {
      page: page.page,
      size: page.size,
      fabId: search.fabId,
      setModelNm: search.setModelNm,
      specNm: search.specNm,
    };

    // 좌측 grid는 Master 전용이므로 upperCd가 빈 row만 내려주는 selectleftpaging을 우선 사용한다.
    // legacySpecs는 로컬 preview API가 아직 준비되지 않은 환경을 위한 개발용 fallback이다.
    return requestJsonFallback(
      () => requestJson(SPEC_MASTER_ENDPOINTS.searchMaster, { params }),
      () => requestJson(SPEC_MASTER_ENDPOINTS.legacySpecs, { params: { fabId: search.fabId, setModelNm: search.setModelNm } })
    );
  },

  getSpec(specId) {
    return requestJson(SPEC_MASTER_ENDPOINTS.specById(specId));
  },

  getChildren(specId) {
    // GoodDocs 10번은 POST로 적혀 있지만 조회 성격이므로 GET을 우선 사용합니다.
    return requestJsonFallback(
      () => requestJson(SPEC_MASTER_ENDPOINTS.children(specId)),
      () => requestJson(SPEC_MASTER_ENDPOINTS.children(specId), { method: "POST", body: { specId } })
    );
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

  deleteSpec(specId, chgChgrEmpno) {
    return requestJson(SPEC_MASTER_ENDPOINTS.specById(specId), {
      method: "DELETE",
      params: { chgchgrempno: chgChgrEmpno },
    });
  },
};

export default specMasterApi;
