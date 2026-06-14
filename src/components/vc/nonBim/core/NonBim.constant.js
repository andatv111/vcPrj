/**
 * Non-BIM과 Calculator가 공유하는 화면 상수입니다.
 * Status는 공사요청상태이며 계산 저장 상태와 분리해서 해석합니다.
 */
export const MAX_CHAMBER_COUNT = 10;
// 사용자가 추가한 Chamber의 기본 탭명에 사용하는 접두어입니다.
export const CHAMBER_PREFIX = "CHAMBER";

// 화면/계산 payload에서 공유하는 배관 유형 코드입니다. B/E 코드값이 바뀌면 helper normalize도 함께 확인합니다.
export const PIPE_TYPE = {
  PIPE: "PIPE",
  ELBOW: "ELBOW",
  REDUCER: "REDUCER",
};

// 수기 도면의 업무 진행 상태입니다. 계산 저장 완료 여부가 아니라 도면 요청 상태를 뜻합니다.
export const DRAWING_STATUS = {
  READY: "Ready",
  IN_REVIEW: "In Review",
  DRAFT: "Draft",
  SAVED: "Saved",
  DRAFT_ATTACHED: "Draft Attached",
};

// 향후 정책상 계산 화면에서 잠금이 필요한 공사요청상태가 생기면 이 목록에만 추가합니다.
// 화면 전체 메뉴를 막지 않고, 선택 도면의 Calculate 버튼 노출만 제어하는 화면 스코프 정책입니다.
export const CALCULATION_LOCKED_DRAWING_STATUSES = [
  DRAWING_STATUS.SAVED,
  DRAWING_STATUS.DRAFT_ATTACHED,
];

// 배관 유형별 입력 가능 컬럼과 필수값 정책입니다. reducer와 validation이 같은 기준을 사용합니다.
// fixedQuantity가 있으면 사용자가 입력하지 않아도 normalize 단계에서 그 값으로 보정됩니다.
export const PIPE_TYPE_FIELD_POLICY = {
  [PIPE_TYPE.PIPE]: {
    inletDiameter: true,
    length: true,
    angle: false,
    outletDiameter: false,
    quantity: false,
    fixedQuantity: 1,
    requiredFields: ["inletDiameter", "length"],
  },
  [PIPE_TYPE.ELBOW]: {
    inletDiameter: true,
    length: false,
    angle: true,
    outletDiameter: false,
    quantity: true,
    fixedQuantity: null,
    requiredFields: ["inletDiameter", "angle", "quantity"],
  },
  [PIPE_TYPE.REDUCER]: {
    inletDiameter: true,
    length: true,
    angle: false,
    outletDiameter: true,
    quantity: false,
    fixedQuantity: 1,
    requiredFields: ["inletDiameter", "length", "outletDiameter"],
  },
};

// Manual Drawing Results 그리드 컬럼입니다. key는 normalizeDrawing 결과 key와 맞춰야 합니다.
export const DRAWING_COLUMNS = [
  { key: "select", label: "" },
  { key: "constructionNo", label: "공사번호" },
  { key: "eqId", label: "장비명(EQ_ID)" },
  { key: "site", label: "Site" },
  { key: "fab", label: "FAB" },
  { key: "area1", label: "Area1" },
  { key: "area2", label: "Area2" },
  { key: "changeType", label: "변경유형" },
  { key: "equipmentType", label: "장비구분" },
  { key: "requestStatus", label: "요청상태" },
  { key: "forelineCategoryName", label: "카테고리명" },
  { key: "forelineRegisteredAt", label: "등록일" },
  { key: "forelineRegisteredBy", label: "등록자" },
  { key: "forelineDownload", label: "다운로드" },
];

// Chamber별 배관 입력 그리드 컬럼입니다. key는 pipe row 모델과 isPipeFieldEditable 정책에 연결됩니다.
export const PIPE_COLUMNS = [
  { key: "select", label: "" },
  { key: "type", label: "유형" },
  { key: "inletDiameter", label: "입구내경(in)" },
  { key: "length", label: "길이(mm)" },
  { key: "angle", label: "각도(deg)" },
  { key: "outletDiameter", label: "출구내경(in)" },
  { key: "quantity", label: "수량(EA)" },
];

// Vacuum Conductance Result 공통 팝업 컬럼입니다.
// Non-BIM과 Calculator가 같은 컬럼을 사용하므로 result normalize 모델을 바꿀 때 함께 점검합니다.
export const RESULT_COLUMNS = [
  { key: "chamberId", label: "Chamber ID" },
  { key: "processLarge", label: "공정대분류" },
  { key: "processMiddle", label: "공정중분류" },
  { key: "modelStandard", label: "모델관리기준" },
  { key: "minSpec", label: "Min Spec" },
  { key: "maxSpec", label: "Max Spec" },
  { key: "conductance", label: "Conductance" },
  { key: "judge", label: "판정" },
];
// Java VcSimResultRow.judge와 F/E 판정값이 동일하게 사용하는 표준 코드입니다.
export const JUDGE = {
  IN: "IN",
  HIGH_OUT: "HIGH_OUT",
  LOW_OUT: "LOW_OUT",
  NA: "NA",
  NONE: "NONE",
  PENDING: "PENDING",
};

// 판정 badge에 보여줄 표시명입니다. 데이터 비교에는 JUDGE 값을 사용합니다.
export const JUDGE_LABEL = {
  [JUDGE.IN]: "IN",
  [JUDGE.HIGH_OUT]: "High Out",
  [JUDGE.LOW_OUT]: "Low Out",
  [JUDGE.NA]: "N/A",
  [JUDGE.NONE]: "-",
  [JUDGE.PENDING]: "Pending",
};

export const CALCULATION_NA_TEXT = "N/A";

// Non-BIM 검색 조건 초기값입니다.
export const DEFAULT_SEARCH = {
  fab: "",
  eqId: "",
  constructionNo: "",
};

// Non-BIM 화면의 loading flag 기본값입니다. Calculator와 결과 팝업 loading은 각 slice에서 별도로 관리합니다.
export const DEFAULT_LOADING = {
  options: false,
  eqSuggestions: false,
  drawings: false,
  chambers: false,
  download: false,
  calculate: false,
};

// null, undefined, 빈 문자열을 화면에서 일관되게 표시하는 대체 문구입니다.
export const EMPTY_TEXT = "-";
