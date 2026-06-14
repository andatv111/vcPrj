/**
 * Non-BIM과 Calculator의 화면 모델, 검증, API DTO 생성을 담당하는 공통 helper입니다.
 * B/E Java DTO와 동일한 camelCase 필드를 사용하며 조회 DTO와 계산 DTO가 다른 지점만 명시적으로 변환합니다.
 */
import {
  CHAMBER_PREFIX,
  CALCULATION_LOCKED_DRAWING_STATUSES,
  CALCULATION_NA_TEXT,
  EMPTY_TEXT,
  JUDGE,
  MAX_CHAMBER_COUNT,
  PIPE_TYPE,
  PIPE_TYPE_FIELD_POLICY,
} from "./NonBim.constant";

export const createId = (prefix = "ID") => {
  // 화면에서 즉시 추가되는 Chamber/pipe/result row의 임시 key입니다. 서버 PK가 오면 normalize 단계에서 서버 값을 우선합니다.
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
};

// API 응답이 단건/배열/null 중 어떤 형태로 와도 화면 로직은 배열 기준으로 처리합니다.
export const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

// null/undefined만 fallback으로 바꾸고, 0 같은 유효값은 보존합니다.
export const nvl = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return value;
};

// 화면 표시 전용 변환입니다. 실제 payload에는 원본 값 또는 normalize된 값을 사용합니다.
export const toDisplayText = (value) => {
  if (value === undefined || value === null || value === "") return EMPTY_TEXT;
  return value;
};

// 선택 도면의 요청상태가 계산 제한 정책에 포함되는지 판단합니다.
export const isCalculationLockedByDrawingStatus = (status) =>
  CALCULATION_LOCKED_DRAWING_STATUSES.includes(String(status || ""));

// 배관 수치 입력은 숫자와 소수점만 허용합니다. 상세 단위/범위 검증은 B/E 또는 별도 validation에서 확장합니다.
export const onlyNumberLike = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[^\d.]/g, "");
};

// 순번을 두 자리 문자열로 표시해야 하는 화면 값에 사용합니다.
export const leftPad2 = (value) => String(value).padStart(2, "0");

// 기본 Chamber명은 Ch01, Ch02처럼 탭에서 짧게 읽히는 형식으로 만듭니다.
export const createChamberName = (seq) => `${CHAMBER_PREFIX}${seq}`;

// B/E 원본 Chamber명은 유지하고 사용자가 추가한 Chamber만 현재 배열 순서에 맞춰 다시 명명합니다.
export const resequenceChambers = (chambers = []) =>
  toArray(chambers).map((chamber, index) => ({
    ...chamber,
    // B/E에서 조회한 원본 Chamber명은 유지하고, 사용자가 Add한 탭만 현재 순번 이름을 사용합니다.
    chamberName:
      chamber.locked && chamber.chamberName
        ? chamber.chamberName
        : createChamberName(index + 1),
  }));

// 긴 설비/도면 유래 Chamber명은 탭이 깨지지 않도록 앞 10자만 사용합니다.
export const shortenChamberName = (name, fallback) => {
  const text = String(name || fallback || "").trim();
  return text ? text.slice(0, 10) : fallback;
};

// 알 수 없는 유형은 기본 PIPE 정책으로 처리해 입력 화면이 비정상 상태가 되지 않도록 합니다.
export const getPipePolicy = (type) =>
  PIPE_TYPE_FIELD_POLICY[type] || PIPE_TYPE_FIELD_POLICY[PIPE_TYPE.PIPE];

// 배관 유형에 따라 input disabled 여부를 결정합니다.
export const isPipeFieldEditable = (type, fieldName) => Boolean(getPipePolicy(type)[fieldName]);

export const normalizePipeRowByType = (row = {}) => {
  // type 변경 즉시 해당 유형에서 쓰지 않는 값을 비워 payload 오염을 막습니다.
  // 예: ELBOW는 length/outletDiameter를 사용하지 않고 angle/quantity를 사용합니다.
  const type = row.type || PIPE_TYPE.PIPE;
  const policy = getPipePolicy(type);

  return {
    id: row.id || createId("PIPE_ROW"),
    type,
    inletDiameter: policy.inletDiameter ? nvl(row.inletDiameter) : "",
    length: policy.length ? nvl(row.length) : "",
    angle: policy.angle ? nvl(row.angle) : "",
    outletDiameter: policy.outletDiameter ? nvl(row.outletDiameter) : "",
    quantity: policy.fixedQuantity || nvl(row.quantity),
  };
};

// 배관 추가 시 유형 정책이 반영된 빈 입력 행을 생성합니다.
export const createEmptyPipeRow = (type = PIPE_TYPE.PIPE) =>
  normalizePipeRowByType({
    id: createId("PIPE_ROW"),
    type,
    quantity: getPipePolicy(type).fixedQuantity || "",
  });

// Java PortalManualDrawing 필드를 같은 camelCase 이름으로 유지합니다. 화면 선택 키는 constructionNo입니다.
export const normalizeDrawing = (raw = {}) => {
  const foreline = raw.foreline || {};

  return {
    id: raw.id || raw.constructionNo || createId("DRAWING"),
    drawingKey: nvl(raw.drawingKey),
    constructionNo: nvl(raw.constructionNo),
    eqId: nvl(raw.eqId),
    site: nvl(raw.site),
    fab: nvl(raw.fab),
    area1: nvl(raw.area1),
    area2: nvl(raw.area2),
    changeType: nvl(raw.changeType),
    equipmentType: nvl(raw.equipmentType),
    requestStatus: nvl(raw.requestStatus),
    model: nvl(raw.model),
    mainMaker: nvl(raw.mainMaker),
    processLarge: nvl(raw.processLarge),
    processMiddle: nvl(raw.processMiddle),
    chamberCount: Number(raw.chamberCount || 1),
    chambers: toArray(raw.chambers),
    specOptions: toArray(raw.specOptions),
    foreline: {
      categoryName: nvl(foreline.categoryName),
      registeredAt: nvl(foreline.registeredAt),
      registeredBy: nvl(foreline.registeredBy),
      fileId: nvl(foreline.fileId),
      fileName: nvl(foreline.fileName),
    },
    raw,
  };
};

export const normalizeDrawingList = (response) => {
  // VcSimController.manualDrawings는 PortalManualDrawing 배열을 직접 반환합니다.
  return toArray(response).map(normalizeDrawing);
};

// Java PortalManualDrawing.SpecOption 필드를 그대로 사용합니다.
export const normalizeSpecOption = (raw = {}) => ({
  value: nvl(raw.value),
  label: nvl(raw.label),
  minSpec: nvl(raw.minSpec),
  maxSpec: nvl(raw.maxSpec),
  raw,
});

export const normalizeSpecOptions = (rawList) =>
  toArray(rawList).map(normalizeSpecOption).filter((item) => item.value || item.label);

// Chamber 원천 데이터가 없으면 도면의 specOptions와 chamberCount로 기본 탭을 만들 수 있게 표준 모델을 보정합니다.
// locked=true인 Chamber는 도면 원본에서 온 탭으로 보고 삭제를 막습니다. 사용자가 추가한 Chamber만 unlocked입니다.
export const normalizeChamberFromRaw = (raw = {}, index = 0, parentDrawing = {}) => {
  const fallbackSpecOptions = normalizeSpecOptions(parentDrawing.specOptions);
  const specOptions = normalizeSpecOptions(raw.specOptions);
  const mergedSpecOptions = specOptions.length > 0 ? specOptions : fallbackSpecOptions;
  const firstSpec = mergedSpecOptions[0] || null;
  const modelStandard = nvl(raw.modelStandard, firstSpec?.value);
  const minSpec = nvl(raw.minSpec, firstSpec?.minSpec);
  const maxSpec = nvl(raw.maxSpec, firstSpec?.maxSpec);
  const rawPipeRows = toArray(raw.pipeRows);

  return {
    id: raw.chamberId || createId("CHAMBER"),
    chamberId: nvl(raw.chamberId),
    // 기존 탭의 표시명은 설계포탈/B/E의 chamberName이 원천입니다.
    chamberName: nvl(raw.chamberName, createChamberName(index + 1)),
    modelStandard,
    minSpec,
    maxSpec,
    processLarge: nvl(raw.processLarge || parentDrawing.processLarge),
    processMiddle: nvl(raw.processMiddle || parentDrawing.processMiddle),
    isSpecSkipped: false,
    calculationTarget:
      raw.calculationTarget !== undefined
        ? Boolean(raw.calculationTarget)
        : Boolean(modelStandard && (minSpec || maxSpec)),
    specOptions: mergedSpecOptions,
    // 조회 모델의 pipeRows를 계산 DTO의 pipeList로 한 번만 변환합니다.
    pipeList: rawPipeRows.length
      ? rawPipeRows.map((row) =>
          normalizePipeRowByType({
            id: createId("PIPE_ROW"),
            type: row.pipeType || PIPE_TYPE.PIPE,
            inletDiameter: row.inletDia,
            length: row.pipeLength,
            angle: row.angle,
            outletDiameter: row.outletDia,
            quantity: row.qty,
          })
        )
      : [createEmptyPipeRow()],
    selectedPipeRowId: "",
    locked: raw.locked !== undefined ? Boolean(raw.locked) : true,
    raw,
  };
};

export const normalizeChambersFromDrawing = (drawing) => {
  // 1순위는 API가 내려준 chambers입니다. 없으면 chamberCount만큼 기본 탭을 만들어 사용자가 배관을 채울 수 있게 합니다.
  const rawChambers = toArray(drawing?.chambers);
  const chamberCount = Math.max(Number(drawing?.chamberCount || rawChambers.length || 1), 1);

  if (rawChambers.length > 0) {
    return resequenceChambers(
      rawChambers.slice(0, MAX_CHAMBER_COUNT).map((raw, index) =>
        normalizeChamberFromRaw({ ...raw, locked: true }, index, drawing)
      )
    );
  }

  return resequenceChambers(
    Array.from({ length: Math.min(chamberCount, MAX_CHAMBER_COUNT) }).map((_, index) =>
      normalizeChamberFromRaw({ chamberName: createChamberName(index + 1), locked: true }, index, drawing)
    )
  );
};

// 신규 Chamber의 화면 순번은 현재 개수 다음 값으로 계산하되 업무 상한을 넘지 않습니다.
export const getNextChamberSeq = (chambers = []) => Math.min(chambers.length + 1, MAX_CHAMBER_COUNT);

// Chamber 추가 버튼 활성화 여부를 공통 상한 기준으로 판단합니다.
export const canAddChamber = (chambers = []) => toArray(chambers).length < MAX_CHAMBER_COUNT;

export const createUserChamber = (chambers = [], selectedDrawing = {}) => {
  // 사용자가 추가한 Chamber도 선택 도면의 공정/Spec option을 기본 상속해 기존 도면 탭과 같은 계산 규칙을 탑니다.
  const seq = getNextChamberSeq(chambers);
  const base = normalizeChamberFromRaw(
    {
      chamberName: createChamberName(seq),
      locked: false,
    },
    seq - 1,
    selectedDrawing
  );

  return {
    ...base,
    id: createId("CHAMBER"),
    chamberId: "",
    locked: false,
  };
};

// Model Standard 선택 시 Min/Max Spec을 옵션 데이터에서 가져오고, Spec이 없으면 산출대상을 자동 off 합니다.
export const applySpecToChamber = (chamber, modelStandardValue) => {
  const spec = toArray(chamber?.specOptions).find(
    (item) => item.value === modelStandardValue || item.label === modelStandardValue
  );

  return {
    ...chamber,
    modelStandard: modelStandardValue,
    minSpec: spec ? spec.minSpec : "",
    maxSpec: spec ? spec.maxSpec : "",
    isSpecSkipped: false,
    calculationTarget: Boolean(spec && modelStandardValue && (spec.minSpec || spec.maxSpec)),
  };
};

export const buildFileDownloadName = (drawing = {}) => {
  // 서버 파일명이 있으면 그대로 쓰고, 없으면 사용자가 알아볼 수 있는 EQ/공사번호 조합으로 보정합니다.
  if (drawing.foreline?.fileName) return drawing.foreline.fileName;
  return `${drawing.eqId || "EQ"}_${drawing.constructionNo || "DRAWING"}_Foreline`;
};

export const buildEquipmentContextParams = (drawing = {}, extraParams = {}) => ({
  // EQ ID가 Chamber 수와 Spec 조회의 장비 기준 키입니다. lineId/revision 같은 키가 늘면 이 함수만 확장합니다.
  eqId: drawing.eqId,
  constructionNo: drawing.constructionNo,
  fab: drawing.fab,
  model: drawing.model,
  drawingKey: drawing.drawingKey,
  fileId: drawing.foreline?.fileId,
  ...extraParams,
});

export const buildForelineDownloadParams = (drawing = {}, extraParams = {}) => ({
  // 다운로드 API는 EQ ID와 공사번호가 필수입니다. 파일 키는 보조값으로 같이 넘겨 B/E 파라미터 변경에 대응합니다.
  ...buildEquipmentContextParams(drawing, extraParams),
});

export const downloadBlob = (blob, fileName) => {
  // 브라우저 환경에서만 임시 anchor를 만들어 파일 다운로드를 트리거합니다.
  if (!blob || typeof window === "undefined") return;

  const objectUrl = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};

export const findActiveChamber = (chambers = [], activeChamberId) => {
  // activeChamberId가 삭제되었거나 비어 있으면 첫 Chamber를 fallback으로 반환해 화면이 비지 않게 합니다.
  if (!chambers.length) return null;
  return chambers.find((chamber) => chamber.id === activeChamberId) || chambers[0];
};

export const validateRequiredPipeFields = (row) => {
  // 필수값 판단도 PIPE_TYPE_FIELD_POLICY를 사용해 화면 disabled 정책과 검증 정책을 일치시킵니다.
  const policy = getPipePolicy(row.type);

  const missingFields = policy.requiredFields.filter((fieldName) => {
    const value = row[fieldName];
    return value === undefined || value === null || value === "";
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

// Non-BIM 계산은 선택 도면이 필요하지만, 상단 그리드 모델 정보가 아니라 Chamber별 Model Standard/Spec으로 산출 가능 여부를 판단합니다.
export const validateNonBimBeforeCalculate = ({ selectedDrawing, chambers }) => {
  if (!selectedDrawing) {
    return { valid: false, message: "수기 도면 데이터를 먼저 선택해 주세요." };
  }

  return validateChambersBeforeCalculate(chambers);
};

export const validateChambersBeforeCalculate = (chambers) => {
  // 산출대상이 꺼진 Chamber는 의도적으로 계산에서 제외되므로 Spec/배관 필수값 검증을 건너뜁니다.
  if (!toArray(chambers).length) {
    return { valid: false, message: "Chamber 정보가 없습니다." };
  }

  for (const chamber of chambers) {
    if (chamber.calculationTarget === false) continue;

    if (!chamber.modelStandard) {
      return { valid: false, message: `${chamber.chamberName}의 모델관리기준을 선택해 주세요.` };
    }

    if (!chamber.minSpec && !chamber.maxSpec) {
      return { valid: false, message: `${chamber.chamberName}의 Min/Max Spec을 확인해 주세요.` };
    }

    if (!toArray(chamber.pipeList).length) {
      return { valid: false, message: `${chamber.chamberName}의 배관 정보를 입력해 주세요.` };
    }

    for (const row of chamber.pipeList) {
      const rowCheck = validateRequiredPipeFields(row);
      if (!rowCheck.valid) {
        return { valid: false, message: `${chamber.chamberName}의 ${row.type} 필수값을 입력해 주세요.` };
      }
    }
  }

  return { valid: true, message: "" };
};

// Non-BIM 계산 API payload입니다. V/C Master 저장 상태와 무관한 순수 계산 요청입니다.
// 상단 도면 row는 설비/공정 메타를 제공하고, 실제 Model Standard/Spec/배관은 Chamber별 입력값을 우선합니다.
export const buildNonBimCalculatePayload = (state) => {
  const selectedDrawing = state.selectedDrawing;
  const activeChamber =
    toArray(state.chambers).find((chamber) => chamber.id === state.activeChamberId) ||
    toArray(state.chambers)[0] ||
    {};

  return {
    sourceType: "NON_BIM",
    constructionNo: selectedDrawing?.constructionNo,
    search: {
      fab: state.search?.fab,
      eqId: state.search?.eqId,
      constructionNo: state.search?.constructionNo,
    },
    equipment: {
      eqId: selectedDrawing?.eqId,
      constructionNo: selectedDrawing?.constructionNo,
      site: selectedDrawing?.site,
      fab: selectedDrawing?.fab,
      area1: selectedDrawing?.area1,
      area2: selectedDrawing?.area2,
      model: selectedDrawing?.model,
      modelStandard: activeChamber.modelStandard,
      mainMaker: selectedDrawing?.mainMaker,
      processLarge: selectedDrawing?.processLarge,
      processMiddle: selectedDrawing?.processMiddle,
    },
    chambers: toArray(state.chambers).map((chamber, index) => ({
      seq: index + 1,
      chamberId: chamber.chamberId,
      chamberName: chamber.chamberName || createChamberName(index + 1),
      calculationTarget: Boolean(chamber.calculationTarget),
      modelStandard: chamber.modelStandard,
      minSpec: chamber.minSpec,
      maxSpec: chamber.maxSpec,
      isSpecSkipped: chamber.isSpecSkipped || !chamber.calculationTarget,
      processLarge: chamber.processLarge || selectedDrawing?.processLarge,
      processMiddle: chamber.processMiddle || selectedDrawing?.processMiddle,
      pipeList: toArray(chamber.pipeList).map((row, rowIndex) => ({
        seq: rowIndex + 1,
        type: row.type,
        inletDiameter: row.inletDiameter,
        length: row.length,
        angle: row.angle,
        outletDiameter: row.outletDiameter,
        quantity: row.quantity,
      })),
    })),
  };
};

// Calculator 계산 API payload입니다. 결과 팝업을 공유하기 위해 Non-BIM과 같은 rows 응답 구조를 기대합니다.
// 장비 기준 Model Standard가 모든 Chamber에 공통 적용되므로 Chamber별 modelStandard 대신 equipment 값을 내려줍니다.
export const buildCalculatorCalculatePayload = (state) => {
  const equipment = state.equipment || {};

  return {
    sourceType: "CALCULATOR",
    equipment: {
      eqId: "",
      fab: equipment.fab,
      model: equipment.model,
      processLarge: "Manual",
      processMiddle: "Calculator",
    },
    chambers: toArray(state.chambers).map((chamber, index) => ({
      seq: index + 1,
      chamberId: chamber.chamberId,
      chamberName: chamber.chamberName || createChamberName(index + 1),
      calculationTarget: Boolean(chamber.calculationTarget),
      modelStandard: chamber.modelStandard,
      minSpec: chamber.minSpec,
      maxSpec: chamber.maxSpec,
      isSpecSkipped: !chamber.modelStandard || !chamber.calculationTarget,
      processLarge: chamber.processLarge || "Manual",
      processMiddle: chamber.processMiddle || "Calculator",
      pipeList: toArray(chamber.pipeList).map((row, rowIndex) => ({
        seq: rowIndex + 1,
        type: row.type,
        inletDiameter: row.inletDiameter,
        length: row.length,
        angle: row.angle,
        outletDiameter: row.outletDiameter,
        quantity: row.quantity,
      })),
    })),
  };
};

export const hasSpecOutRows = (rows = []) =>
  toArray(rows).some((row) => row.judge === JUDGE.HIGH_OUT || row.judge === JUDGE.LOW_OUT);

// Min 또는 Max 중 하나라도 있으면 판정 기준이 존재하는 결과로 봅니다.
export const hasSpecBounds = (row = {}) => Boolean(row.minSpec || row.maxSpec);

// Spec 범위가 없는 row는 Min/Max와 판정 컬럼을 '-' 또는 N/A 성격으로 보여줍니다.
export const shouldShowSpecColumns = (row = {}) => hasSpecBounds(row);

// Java VcSimResultRow 응답을 공통 팝업 모델로 옮깁니다. 산출대상 제외 row는 N/A로 보정합니다.
// 응답 wrapper는 현재 VcSimFacadeService의 { success, data } 계약만 허용합니다.
export const normalizeCalculationResult = (response, payload) => {
  const rawRows = response?.data?.rows || [];

  const rows = toArray(rawRows).map((raw, index) => {
    const payloadChamber = payload?.chambers?.[index] || {};
    const modelStandard = nvl(raw.modelStandard, payloadChamber.modelStandard);
    const calculationTarget = payloadChamber.calculationTarget !== false;

    return {
      id: raw.id || createId("RESULT"),
      chamberId: nvl(raw.chamberId, payloadChamber.chamberId || createId("CHAMBER_KEY")),
      chamberName: nvl(raw.chamberName, payloadChamber.chamberName),
      confirmFlag: nvl(raw.confirmFlag, "N"),
      processLarge: nvl(raw.processLarge, payloadChamber.processLarge),
      processMiddle: nvl(raw.processMiddle, payloadChamber.processMiddle),
      modelStandard,
      minSpec: nvl(raw.minSpec, payloadChamber.minSpec),
      maxSpec: nvl(raw.maxSpec, payloadChamber.maxSpec),
      calculationTarget,
      conductance: calculationTarget
        ? nvl(raw.conductance)
        : CALCULATION_NA_TEXT,
      judge: calculationTarget ? nvl(raw.judge, JUDGE.NONE) : JUDGE.NA,
      hasModelStandard: Boolean(modelStandard),
      raw,
    };
  });

  // 응답 row가 없는 개발/예외 상황에도 사용자가 요청한 Chamber 기준으로 결과 표 구조를 유지합니다.
  const fallbackRows = toArray(payload?.chambers).map((chamber) => ({
    id: createId("RESULT"),
    chamberId: chamber.chamberId || createId("CHAMBER_KEY"),
    chamberName: chamber.chamberName,
    confirmFlag: "N",
    processLarge: chamber.processLarge,
    processMiddle: chamber.processMiddle,
    modelStandard: chamber.modelStandard,
    minSpec: chamber.minSpec,
    maxSpec: chamber.maxSpec,
    calculationTarget: chamber.calculationTarget !== false,
    conductance: chamber.calculationTarget === false ? CALCULATION_NA_TEXT : "",
    judge:
      chamber.calculationTarget === false
        ? JUDGE.NA
        : chamber.isSpecSkipped || (!chamber.minSpec && !chamber.maxSpec)
          ? JUDGE.NONE
          : JUDGE.PENDING,
    hasModelStandard: Boolean(chamber.modelStandard),
    raw: {},
  }));

  const equipment = payload?.equipment || {};

  return {
    sourceType: payload?.sourceType,
    basicInfo: {
      eqId: response?.data?.eqId || equipment.eqId,
      fab: response?.data?.fab || equipment.fab,
      model: response?.data?.model || equipment.model,
      constructionNo: equipment.constructionNo,
      site: equipment.site,
      area1: equipment.area1,
      area2: equipment.area2,
    },
    rows: rows.length > 0 ? rows : fallbackRows,
    raw: response,
  };
};
