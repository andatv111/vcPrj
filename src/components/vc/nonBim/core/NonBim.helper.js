/**
 * Shared helper for Non-BIM and Calculator screen models, validation, and API DTO mapping.
 * Keep Java DTO field names in camelCase here so screen components do not know table details.
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

// Java DesignPortalDrawing 필드를 같은 camelCase 이름으로 유지합니다.
// id는 DB/API 필드가 아니라 React row 렌더링에만 사용하는 eqId+woId 복합 key입니다.
export const normalizeDrawing = (raw = {}) => {
  const woId = nvl(raw.woId);
  const eqId = nvl(raw.eqId);

  return {
    id: [eqId, woId].filter(Boolean).join("_") || createId("DRAWING"),
    woId,
    eqId,
    siteCd: nvl(raw.siteCd),
    siteNm: nvl(raw.siteNm),
    fabCd: nvl(raw.fabCd),
    fabNm: nvl(raw.fabNm),
    area: nvl(raw.area),
    areaDetail: nvl(raw.areaDetail),
    chgType1: nvl(raw.chgType1),
    chgType1Nm: nvl(raw.chgType1Nm),
    catNm: nvl(raw.catNm),
    crteDt: nvl(raw.crteDt),
    crteId: nvl(raw.crteId),
    crteIdNm: nvl(raw.crteIdNm),
    file: nvl(raw.file),
    fileSeq: nvl(raw.fileSeq),
    fileNm: nvl(raw.fileNm),
    fileOrgNm: nvl(raw.fileOrgNm),
    fileDisSize: nvl(raw.fileDisSize),
    requestStatus: nvl(raw.requestStatus),
    setModelNm: nvl(raw.setModelNm),
    eqpMakerNm: nvl(raw.eqpMakerNm),
    operLargeCatgVal: nvl(raw.operLargeCatgVal),
    operMidCatgVal: nvl(raw.operMidCatgVal),
    chamberCount: Number(raw.chamberCount || 1),
    chambers: toArray(raw.chambers),
    specOptions: toArray(raw.specOptions),
    raw,
  };
};

export const normalizeDrawingList = (response) => {
  // VcSimController.manualDrawings는 DesignPortalDrawing 배열을 직접 반환합니다.
  return toArray(response).map(normalizeDrawing);
};

// Java DesignPortalDrawing.SpecOption 필드를 그대로 사용합니다.
export const normalizeSpecOption = (raw = {}) => ({
  value: nvl(raw.value),
  label: nvl(raw.label),
  minSpec: nvl(raw.minSpec),
  maxSpec: nvl(raw.maxSpec),
  fab: nvl(raw.fab),
  model: nvl(raw.model),
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
    processLarge: nvl(raw.operLargeCatgVal || parentDrawing.operLargeCatgVal),
    processMiddle: nvl(raw.operMidCatgVal || parentDrawing.operMidCatgVal),
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

// Non-BIM uses this strict spec rule: no selected Model Standard/spec means no calculation target.
// Calculator overrides that behavior in its reducer so specless chambers can still calculate conductance.
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
  if (drawing.fileNm) return drawing.fileNm;
  return `${drawing.eqId || "EQ"}_${drawing.woId || "DRAWING"}_Foreline`;
};

export const buildEquipmentContextParams = (drawing = {}, extraParams = {}) => ({
  eqId: drawing.eqId,
  woId: drawing.woId,
  fabCd: drawing.fabCd,
  setModelNm: drawing.setModelNm,
  file: drawing.file,
  fileSeq: drawing.fileSeq,
  ...extraParams,
});

export const buildForelineDownloadParams = (drawing = {}, extraParams = {}) => ({
  // 다운로드 API는 EQ ID와 WO ID가 필수입니다. 파일 키는 보조값으로 같이 넘겨 B/E 파라미터 변경에 대응합니다.
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

// Non-BIM requires a selected design-portal drawing and strict chamber spec validation.
export const validateNonBimBeforeCalculate = ({ selectedDrawing, chambers }) => {
  if (!selectedDrawing) {
    return { valid: false, message: "Select a drawing before calculating." };
  }

  return validateChambersBeforeCalculate(chambers);
};

export const validateChambersBeforeCalculate = (chambers, { allowSpecless = false } = {}) => {
  // Non-BIM requires Model Standard and Min/Max spec. Calculator can calculate without them and show judge NA.
  if (!toArray(chambers).length) {
    return { valid: false, message: "Chamber information is missing." };
  }

  if (!toArray(chambers).some((chamber) => chamber.calculationTarget !== false)) {
    return { valid: false, message: "Select at least one calculation target chamber." };
  }

  for (const chamber of chambers) {
    if (chamber.calculationTarget === false) continue;

    if (!allowSpecless && !chamber.modelStandard) {
      return { valid: false, message: `${chamber.chamberName} requires a Model Standard.` };
    }

    if (!allowSpecless && !chamber.minSpec && !chamber.maxSpec) {
      return { valid: false, message: `${chamber.chamberName} requires Min/Max Spec.` };
    }

    if (!toArray(chamber.pipeList).length) {
      return { valid: false, message: `${chamber.chamberName} requires pipe information.` };
    }

    for (const row of chamber.pipeList) {
      const rowCheck = validateRequiredPipeFields(row);
      if (!rowCheck.valid) {
        return { valid: false, message: `${chamber.chamberName} has missing required ${row.type} values.` };
      }
    }
  }

  return { valid: true, message: "" };
};

export const buildNonBimCalculatePayload = (state) => {
  // Non-BIM payload is anchored by WO_ID/woId from the selected design-portal row.
  const selectedDrawing = state.selectedDrawing;
  const activeChamber =
    toArray(state.chambers).find((chamber) => chamber.id === state.activeChamberId) ||
    toArray(state.chambers)[0] ||
    {};

  return {
    sourceType: "NON_BIM",
    woId: selectedDrawing?.woId,
    search: {
      fabCd: state.search?.fabCd,
      eqId: state.search?.eqId,
      woId: state.search?.woId,
    },
    equipment: {
      eqId: selectedDrawing?.eqId,
      woId: selectedDrawing?.woId,
      siteCd: selectedDrawing?.siteCd,
      siteNm: selectedDrawing?.siteNm,
      fabCd: selectedDrawing?.fabCd,
      fabNm: selectedDrawing?.fabNm,
      area: selectedDrawing?.area,
      areaDetail: selectedDrawing?.areaDetail,
      chgType1: selectedDrawing?.chgType1,
      chgType1Nm: selectedDrawing?.chgType1Nm,
      catNm: selectedDrawing?.catNm,
      setModelNm: selectedDrawing?.setModelNm,
      modelStandard: activeChamber.modelStandard,
      eqpMakerNm: selectedDrawing?.eqpMakerNm,
      operLargeCatgVal: selectedDrawing?.operLargeCatgVal,
      operMidCatgVal: selectedDrawing?.operMidCatgVal,
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
      processLarge: chamber.processLarge || selectedDrawing?.operLargeCatgVal,
      processMiddle: chamber.processMiddle || selectedDrawing?.operMidCatgVal,
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

export const buildCalculatorCalculatePayload = (state) => {
  // Calculator has no selected design-portal row; it sends manually entered chamber and pipe data only.
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

// Convert Java VcSimResultRow data into the shared result popup model.
// calculationTarget controls conductance calculation; Model Standard/spec controls judge availability.
export const normalizeCalculationResult = (response, payload) => {
  const rawRows = response?.data?.rows || [];

  const rows = toArray(rawRows).map((raw, index) => {
    const payloadChamber = payload?.chambers?.[index] || {};
    const modelStandard = nvl(raw.modelStandard, payloadChamber.modelStandard);
    const calculationTarget = payloadChamber.calculationTarget !== false;
    const speclessCalculation = calculationTarget && (!modelStandard || (!payloadChamber.minSpec && !payloadChamber.maxSpec));

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
      conductance: calculationTarget ? nvl(raw.conductance) : CALCULATION_NA_TEXT,
      judge: speclessCalculation ? JUDGE.NA : calculationTarget ? nvl(raw.judge, JUDGE.NONE) : JUDGE.NA,
      hasModelStandard: Boolean(modelStandard),
      raw,
    };
  });

  // If the backend returns no rows during local/mock development, keep the popup shape stable.
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
      chamber.calculationTarget === false || !chamber.modelStandard || (!chamber.minSpec && !chamber.maxSpec)
        ? JUDGE.NA
        : JUDGE.PENDING,
    hasModelStandard: Boolean(chamber.modelStandard),
    raw: {},
  }));

  const equipment = payload?.equipment || {};

  return {
    sourceType: payload?.sourceType,
    basicInfo: {
      eqId: response?.data?.eqId || equipment.eqId,
      fabCd: response?.data?.fabCd || equipment.fabCd,
      setModelNm: response?.data?.setModelNm || equipment.setModelNm,
      woId: equipment.woId,
      siteNm: equipment.siteNm,
      area: equipment.area,
      areaDetail: equipment.areaDetail,
    },
    rows: rows.length > 0 ? rows : fallbackRows,
    raw: response,
  };
};
