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

// B/E 조회 응답의 requestStatus가 아래 값 중 하나이면 이미 저장/기안 완료된 도면으로 보고
// Non-BIM 화면의 Calculate 버튼을 숨깁니다. 실제 연동 시에는 회사 상태 코드도 여기로 매핑하세요.
export const CALCULATION_LOCKED_DRAWING_STATUSES = [
  DRAWING_STATUS.SAVED,
  DRAWING_STATUS.DRAFT_ATTACHED,
];

// 배관 유형별 입력 가능 컬럼과 필수값 정책입니다.
// reducer/helper는 이 정책을 기준으로 비활성 컬럼 값을 비우고 계산 전 필수값을 검증합니다.
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

// 화면 테이블 컬럼 정의는 컴포넌트 렌더링과 표시 순서를 한 곳에서 맞추기 위한 기준값입니다.
export const PIPE_COLUMNS = [
  { key: "select", label: "Chk" },
  { key: "type", label: "유형" },
  { key: "inletDiameter", label: "입구내경" },
  { key: "length", label: "길이" },
  { key: "angle", label: "각도" },
  { key: "outletDiameter", label: "출구내경" },
  { key: "quantity", label: "수량" },
];

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
  NONE: "NONE",
  PENDING: "PENDING",
};

// API마다 판정 코드가 조금 달라도 normalizeJudge에서 아래 표준 코드로 맞춘 뒤 화면에 노출합니다.
export const JUDGE_LABEL = {
  [JUDGE.IN]: "IN",
  [JUDGE.HIGH_OUT]: "High Out",
  [JUDGE.LOW_OUT]: "Low Out",
  [JUDGE.NONE]: "-",
  [JUDGE.PENDING]: "Pending",
};

export const DEFAULT_SEARCH = {
  eqId: "",
  constructionNo: "",
};

// 요청별 loading key를 분리해 자동완성, 조회, 다운로드, 계산 버튼을 독립적으로 제어합니다.
export const DEFAULT_LOADING = {
  eqSuggestions: false,
  drawings: false,
  download: false,
  calculate: false,
};

export const EMPTY_TEXT = "-";
