export const SPEC_MASTER_ENDPOINTS = {
  // Master row 신규 등록. Detail 신규는 children endpoint를 쓴다.
  createMaster: "/api/vc/specmaster",
  // 좌측 Master Grid 전용 조회. upperCd가 빈 row만 내려오는 것이 화면 사상에 맞다.
  searchMaster: "/api/vc/specmaster/selectleftpaging",
  // GoodDocs에 있던 조건 조회 API. 현재 화면 기본 흐름에서는 직접 쓰지 않지만 endpoint를 남겨 추후 비교 가능하게 한다.
  searchByCondition: "/api/vc/specmaster/selectcondition",
  // MODEL, 모델관리기준, 공정, CHAMBER SPEC 후보 조회.
  filterOptions: "/api/vc/specmaster/selectfilteroptions",
  // 단건 조회/수정/삭제 공통 path.
  specById: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}`,
  // 선택 Master의 하위 Detail 조회와 Detail 신규 등록에 함께 쓰는 path.
  children: (specId) => `/api/vc/specmaster/${encodeURIComponent(specId)}/children`,
  // FAB 콤보는 SpecMaster가 아니라 회사 공통코드 API가 원천이다.
  fabCommonCodes: "/api/commcode/comm-code-list",
  // 로컬 preview 초기에 쓰던 fallback. 회사 B/E가 준비되면 정상 path만 타게 된다.
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

// 회사 API가 { success, data, message } wrapper를 쓰는 경우 data만 꺼낸다.
// wrapper가 없으면 payload 자체를 그대로 saga에 넘긴다.
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

// GoodDocs와 실제 B/E가 맞춰지는 중이라 일부 API는 우선 path 실패 시 preview fallback을 한 번 더 시도한다.
// 화면 컴포넌트는 fallback 여부를 몰라도 되고, saga에는 최종 payload만 전달된다.
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
    // SearchPanel의 FAB/MODEL/모델관리기준 조건을 좌측 Master Grid 조회 query로 보낸다.
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
    // 현재 수정 팝업은 grid row를 그대로 쓰지만, 최신 DB 값을 다시 읽어야 하면 이 함수를 연결하면 된다.
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
    // Master 신규: upperCd가 빈 상위 Spec row를 만든다.
    return requestJson(SPEC_MASTER_ENDPOINTS.createMaster, {
      method: "POST",
      body: payload,
    });
  },

  updateSpec(specId, payload) {
    // Master/Detail 수정 공통: 같은 VCW_VC_SPEC_MST row를 specId로 수정한다.
    return requestJson(SPEC_MASTER_ENDPOINTS.specById(specId), {
      method: "PATCH",
      body: payload,
    });
  },

  createChild(parentSpecId, payload) {
    // Detail 신규: path의 parentSpecId가 저장 row의 upperCd가 된다.
    return requestJson(SPEC_MASTER_ENDPOINTS.children(parentSpecId), {
      method: "POST",
      body: payload,
    });
  },

  deleteSpec(specId, chgChgrEmpno) {
    // Master/Detail 삭제 공통. Master children 동시 삭제 여부는 B/E 정책이다.
    return requestJson(SPEC_MASTER_ENDPOINTS.specById(specId), {
      method: "DELETE",
      params: { chgchgrempno: chgChgrEmpno },
    });
  },
};

export default specMasterApi;
