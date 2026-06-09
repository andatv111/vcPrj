/**
 * Non-BIM과 Calculator가 공유하는 화면 상수입니다.
 * Status는 공사요청상태이며 계산 저장 상태와 분리해서 해석합니다.
 */
export const MAX_CHAMBER_COUNT = 10;
export const CHAMBER_PREFIX = "Ch";

export const PIPE_TYPE = {
  PIPE: "PIPE",
  ELBOW: "ELBOW",
  REDUCER: "REDUCER",
};

export const PIPE_TYPE_LABEL = {
  [PIPE_TYPE.PIPE]: "Pipe",
  [PIPE_TYPE.ELBOW]: "Elbow",
  [PIPE_TYPE.REDUCER]: "Reducer",
};

export const PIPE_TYPE_OPTIONS = [
  { value: PIPE_TYPE.PIPE, label: PIPE_TYPE_LABEL[PIPE_TYPE.PIPE] },
  { value: PIPE_TYPE.ELBOW, label: PIPE_TYPE_LABEL[PIPE_TYPE.ELBOW] },
  { value: PIPE_TYPE.REDUCER, label: PIPE_TYPE_LABEL[PIPE_TYPE.REDUCER] },
];

export const DRAWING_STATUS = {
  READY: "Ready",
  IN_REVIEW: "In Review",
  DRAFT: "Draft",
  SAVED: "Saved",
  DRAFT_ATTACHED: "Draft Attached",
};

// 향후 정책상 계산 화면에서 잠금이 필요한 공사요청상태가 생기면 이 목록에만 추가합니다.
export const CALCULATION_LOCKED_DRAWING_STATUSES = [
  DRAWING_STATUS.SAVED,
  DRAWING_STATUS.DRAFT_ATTACHED,
];

// 배관 유형별 입력 가능 컬럼과 필수값 정책입니다. reducer와 validation이 같은 기준을 사용합니다.
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

export const DRAWING_COLUMNS = [
  { key: "select", label: "Select" },
  { key: "constructionNo", label: "Construction No." },
  { key: "eqId", label: "EQ ID" },
  { key: "site", label: "Site" },
  { key: "fab", label: "FAB" },
  { key: "area1", label: "Area 1" },
  { key: "area2", label: "Area 2" },
  { key: "changeType", label: "Change Type" },
  { key: "equipmentType", label: "Equipment Type" },
  { key: "requestStatus", label: "Status" },
  { key: "forelineDrawing", label: "Foreline Drawing" },
];

export const PIPE_COLUMNS = [
  { key: "select", label: "Chk" },
  { key: "type", label: "유형" },
  { key: "inletDiameter", label: "입구구경" },
  { key: "length", label: "길이" },
  { key: "angle", label: "각도" },
  { key: "outletDiameter", label: "출구구경" },
  { key: "quantity", label: "수량" },
];

// Vacuum Conductance Result 공통 팝업 컬럼입니다.
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
export const JUDGE = {
  IN: "IN",
  HIGH_OUT: "HIGH_OUT",
  LOW_OUT: "LOW_OUT",
  NA: "NA",
  NONE: "NONE",
  PENDING: "PENDING",
};

export const JUDGE_LABEL = {
  [JUDGE.IN]: "IN",
  [JUDGE.HIGH_OUT]: "High Out",
  [JUDGE.LOW_OUT]: "Low Out",
  [JUDGE.NA]: "N/A",
  [JUDGE.NONE]: "-",
  [JUDGE.PENDING]: "Pending",
};

export const CALCULATION_NA_TEXT = "N/A";

export const DEFAULT_SEARCH = {
  eqId: "",
  constructionNo: "",
};

export const DEFAULT_LOADING = {
  eqSuggestions: false,
  drawings: false,
  download: false,
  calculate: false,
};

export const EMPTY_TEXT = "-";
