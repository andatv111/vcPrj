/**
 * Non-BIM/Calculator 화면 모델 변환 helper입니다.
 * B/E DTO가 바뀔 때 컴포넌트보다 이 파일의 normalize/build 함수에서 먼저 흡수합니다.
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
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
};

export const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

export const nvl = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return value;
};

export const toDisplayText = (value) => {
  if (value === undefined || value === null || value === "") return EMPTY_TEXT;
  return value;
};

export const isCalculationLockedByDrawingStatus = (status) =>
  CALCULATION_LOCKED_DRAWING_STATUSES.includes(String(status || ""));

export const onlyNumberLike = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[^\d.]/g, "");
};

export const leftPad2 = (value) => String(value).padStart(2, "0");

export const createChamberName = (seq) => `${CHAMBER_PREFIX}${leftPad2(seq)}`;

export const shortenChamberName = (name, fallback) => {
  const text = String(name || fallback || "").trim();
  return text ? text.slice(0, 10) : fallback;
};

export const getPipePolicy = (type) =>
  PIPE_TYPE_FIELD_POLICY[type] || PIPE_TYPE_FIELD_POLICY[PIPE_TYPE.PIPE];

export const isPipeFieldEditable = (type, fieldName) => Boolean(getPipePolicy(type)[fieldName]);

export const normalizePipeRowByType = (row = {}) => {
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

export const createEmptyPipeRow = (type = PIPE_TYPE.PIPE) =>
  normalizePipeRowByType({
    id: createId("PIPE_ROW"),
    type,
    quantity: getPipePolicy(type).fixedQuantity || "",
  });

// 수기 도면 조회 응답을 첫 번째 그리드 row 모델로 변환합니다. 화면 선택 키는 constructionNo입니다.
export const normalizeDrawing = (raw = {}) => {
  const foreline = raw.foreline || raw.forelineDrawing || {};

  return {
    id: raw.constructionNo || raw.cnstNo || raw.workNo || raw.id || raw.manualDrawingId || createId("DRAWING"),
    drawingKey: nvl(raw.drawingKey || raw.drawingId || raw.manualDrawingId || raw.id || raw.ifId),
    constructionNo: nvl(raw.constructionNo || raw.cnstNo || raw.workNo),
    eqId: nvl(raw.eqId || raw.equipmentId || raw.mainEqId || raw.eqpId),
    site: nvl(raw.site || raw.siteCd),
    fab: nvl(raw.fab || raw.fabCd),
    area1: nvl(raw.area1 || raw.areaCd || raw.area),
    area2: nvl(raw.area2 || raw.dareaCd || raw.darea),
    changeType: nvl(raw.changeType || raw.chgType),
    equipmentType: nvl(raw.equipmentType || raw.eqType || raw.eqpType),
    requestStatus: nvl(raw.requestStatus || raw.status || raw.reqStatus),
    model: nvl(raw.model || raw.mainModel || raw.mainModelNm),
    mainMaker: nvl(raw.mainMaker || raw.mainMakerNm),
    processLarge: nvl(raw.processLarge || raw.procLcls || raw.processCd),
    processMiddle: nvl(raw.processMiddle || raw.procMcls || raw.subProcessCd),
    chamberCount: Number(raw.chamberCount || raw.chCnt || raw.chamberCnt || 1),
    chambers: toArray(raw.chambers || raw.chamberList),
    specOptions: toArray(raw.specOptions || raw.modelStandardOptions || raw.specList),
    foreline: {
      categoryName: nvl(foreline.categoryName || raw.forelineCategoryName || raw.categoryName),
      registeredAt: nvl(foreline.registeredAt || raw.forelineRegisteredAt || raw.regDt),
      registeredBy: nvl(foreline.registeredBy || raw.forelineRegisteredBy || raw.regUserNm),
      fileId: nvl(foreline.fileId || raw.forelineFileId || raw.fileId),
      fileName: nvl(foreline.fileName || raw.forelineFileName || raw.fileName),
    },
    raw,
  };
};

export const normalizeDrawingList = (response) => {
  const data = response?.data || response?.list || response?.result || response || [];
  return toArray(data).map(normalizeDrawing);
};

export const normalizeSpecOption = (raw = {}) => ({
  value: nvl(raw.value || raw.modelStandard || raw.modelStandardName || raw.specName || raw.cd),
  label: nvl(raw.label || raw.modelStandard || raw.modelStandardName || raw.specName || raw.cdNm || raw.cd),
  minSpec: nvl(raw.minSpec || raw.min || raw.minValue),
  maxSpec: nvl(raw.maxSpec || raw.max || raw.maxValue),
  raw,
});

export const normalizeSpecOptions = (rawList) =>
  toArray(rawList).map(normalizeSpecOption).filter((item) => item.value || item.label);

// Chamber 원천 데이터가 없으면 도면의 specOptions와 chamberCount로 기본 탭을 만들 수 있게 표준 모델을 보정합니다.
export const normalizeChamberFromRaw = (raw = {}, index = 0, parentDrawing = {}) => {
  const fallbackSpecOptions = normalizeSpecOptions(parentDrawing.specOptions);
  const specOptions = normalizeSpecOptions(raw.specOptions || raw.modelStandardOptions || raw.specList);
  const mergedSpecOptions = specOptions.length > 0 ? specOptions : fallbackSpecOptions;
  const firstSpec = mergedSpecOptions[0] || null;
  const modelStandard = nvl(raw.modelStandard || raw.modelStandardName || firstSpec?.value);
  const minSpec = nvl(raw.minSpec || firstSpec?.minSpec);
  const maxSpec = nvl(raw.maxSpec || firstSpec?.maxSpec);
  const rawPipeRows = toArray(raw.pipeRows || raw.pipeList || raw.parts);

  return {
    id: raw.id || raw.chamberId || createId("CHAMBER"),
    chamberId: nvl(raw.chamberId || raw.chId || raw.id),
    name: shortenChamberName(raw.name || raw.chamberName || raw.chNm, createChamberName(index + 1)),
    modelStandard,
    minSpec,
    maxSpec,
    processLarge: nvl(raw.processLarge || parentDrawing.processLarge),
    processMiddle: nvl(raw.processMiddle || parentDrawing.processMiddle),
    isSpecSkipped: false,
    calculateEnabled:
      raw.calculateEnabled !== undefined
        ? Boolean(raw.calculateEnabled)
        : Boolean(modelStandard && (minSpec || maxSpec)),
    specOptions: mergedSpecOptions,
    pipeRows: rawPipeRows.length
      ? rawPipeRows.map((row) =>
          normalizePipeRowByType({
            id: row.id || row.pipeId,
            type: row.type || row.pipeType || PIPE_TYPE.PIPE,
            inletDiameter: row.inletDiameter || row.inletDia,
            length: row.length || row.pipeLength,
            angle: row.angle,
            outletDiameter: row.outletDiameter || row.outletDia,
            quantity: row.quantity || row.qty,
          })
        )
      : [createEmptyPipeRow()],
    selectedPipeRowId: "",
    locked: raw.locked !== undefined ? Boolean(raw.locked) : true,
    raw,
  };
};

export const normalizeChambersFromDrawing = (drawing) => {
  const rawChambers = toArray(drawing?.chambers);
  const chamberCount = Math.max(Number(drawing?.chamberCount || rawChambers.length || 1), 1);

  if (rawChambers.length > 0) {
    return rawChambers.slice(0, MAX_CHAMBER_COUNT).map((raw, index) =>
      normalizeChamberFromRaw({ ...raw, locked: true }, index, drawing)
    );
  }

  return Array.from({ length: Math.min(chamberCount, MAX_CHAMBER_COUNT) }).map((_, index) =>
    normalizeChamberFromRaw({ name: createChamberName(index + 1), locked: true }, index, drawing)
  );
};

export const getNextChamberSeq = (chambers = []) => Math.min(chambers.length + 1, MAX_CHAMBER_COUNT);

export const canAddChamber = (chambers = []) => toArray(chambers).length < MAX_CHAMBER_COUNT;

export const createUserChamber = (chambers = [], selectedDrawing = {}) => {
  const seq = getNextChamberSeq(chambers);
  const base = normalizeChamberFromRaw(
    {
      name: createChamberName(seq),
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
    calculateEnabled: Boolean(spec && modelStandardValue && (spec.minSpec || spec.maxSpec)),
  };
};

export const buildFileDownloadName = (drawing = {}) => {
  if (drawing.foreline?.fileName) return drawing.foreline.fileName;
  return `${drawing.eqId || "EQ"}_${drawing.constructionNo || "DRAWING"}_Foreline`;
};

export const downloadBlob = (blob, fileName) => {
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
  if (!chambers.length) return null;
  return chambers.find((chamber) => chamber.id === activeChamberId) || chambers[0];
};

export const validateRequiredPipeFields = (row) => {
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
  if (!toArray(chambers).length) {
    return { valid: false, message: "Chamber 정보가 없습니다." };
  }

  for (const chamber of chambers) {
    if (chamber.calculateEnabled === false) continue;

    if (!chamber.modelStandard) {
      return { valid: false, message: `${chamber.name}의 모델관리기준을 선택해 주세요.` };
    }

    if (!chamber.minSpec && !chamber.maxSpec) {
      return { valid: false, message: `${chamber.name}의 Min/Max Spec을 확인해 주세요.` };
    }

    if (!toArray(chamber.pipeRows).length) {
      return { valid: false, message: `${chamber.name}의 배관 정보를 입력해 주세요.` };
    }

    for (const row of chamber.pipeRows) {
      const rowCheck = validateRequiredPipeFields(row);
      if (!rowCheck.valid) {
        return { valid: false, message: `${chamber.name}의 ${row.type} 필수값을 입력해 주세요.` };
      }
    }
  }

  return { valid: true, message: "" };
};

// Non-BIM 계산 API payload입니다. V/C Master 저장 상태와 무관한 순수 계산 요청입니다.
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
      chamberName: chamber.name || createChamberName(index + 1),
      calculationTarget: Boolean(chamber.calculateEnabled),
      modelStandard: chamber.modelStandard,
      minSpec: chamber.minSpec,
      maxSpec: chamber.maxSpec,
      isSpecSkipped: chamber.isSpecSkipped || !chamber.calculateEnabled,
      processLarge: chamber.processLarge || selectedDrawing?.processLarge,
      processMiddle: chamber.processMiddle || selectedDrawing?.processMiddle,
      pipeList: toArray(chamber.pipeRows).map((row, rowIndex) => ({
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
export const buildCalculatorCalculatePayload = (state) => {
  const equipment = state.equipment || {};

  return {
    sourceType: "CALCULATOR",
    equipment: {
      eqId: "",
      fab: equipment.fab,
      model: equipment.model,
      modelStandard: equipment.modelStandard,
      minSpec: equipment.minSpec,
      maxSpec: equipment.maxSpec,
      processLarge: "Manual",
      processMiddle: "Calculator",
    },
    chambers: toArray(state.chambers).map((chamber, index) => ({
      seq: index + 1,
      chamberId: chamber.chamberId,
      chamberName: chamber.name || createChamberName(index + 1),
      calculationTarget: Boolean(chamber.calculateEnabled),
      modelStandard: equipment.modelStandard,
      minSpec: equipment.minSpec,
      maxSpec: equipment.maxSpec,
      isSpecSkipped: !equipment.modelStandard || !chamber.calculateEnabled,
      processLarge: chamber.processLarge || "Manual",
      processMiddle: chamber.processMiddle || "Calculator",
      pipeList: toArray(chamber.pipeRows).map((row, rowIndex) => ({
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

export const normalizeJudge = (value) => {
  if (!value) return JUDGE.NONE;
  const upper = String(value).toUpperCase();
  if (upper === "IN" || upper === "SPEC_IN") return JUDGE.IN;
  if (upper.includes("HIGH")) return JUDGE.HIGH_OUT;
  if (upper.includes("LOW")) return JUDGE.LOW_OUT;
  if (upper === "NA" || upper === "N/A") return JUDGE.NA;
  if (upper === "PENDING") return JUDGE.PENDING;
  return value;
};

export const hasSpecOutRows = (rows = []) =>
  toArray(rows).some((row) => row.judge === JUDGE.HIGH_OUT || row.judge === JUDGE.LOW_OUT);

export const hasSpecBounds = (row = {}) => Boolean(row.minSpec || row.maxSpec);

export const shouldShowSpecColumns = (row = {}) => hasSpecBounds(row);

// 계산 응답을 Vacuum Conductance Result 공통 팝업 모델로 변환합니다. 산출대상 제외 row는 N/A로 보정합니다.
export const normalizeCalculationResult = (response, payload) => {
  const rawRows =
    response?.rows ||
    response?.resultRows ||
    response?.result?.rows ||
    response?.data?.rows ||
    response?.data?.resultRows ||
    [];

  const rows = toArray(rawRows).map((raw, index) => {
    const payloadChamber = payload?.chambers?.[index] || {};
    const modelStandard = nvl(raw.modelStandard || raw.modelStandardName || payloadChamber.modelStandard);
    const calculationTarget = payloadChamber.calculationTarget !== false;

    return {
      id: raw.id || raw.resultId || createId("RESULT"),
      chamberId: nvl(raw.chamberId || raw.chId || payloadChamber.chamberId || createId("CHAMBER_KEY")),
      chamberName: nvl(raw.chamberName || payloadChamber.chamberName),
      confirmFlag: nvl(raw.confirmFlag || raw.confirmYn, "N"),
      processLarge: nvl(raw.processLarge || raw.procLcls || payloadChamber.processLarge),
      processMiddle: nvl(raw.processMiddle || raw.procMcls || payloadChamber.processMiddle),
      modelStandard,
      minSpec: nvl(raw.minSpec || payloadChamber.minSpec),
      maxSpec: nvl(raw.maxSpec || payloadChamber.maxSpec),
      calculationTarget,
      conductance: calculationTarget
        ? nvl(raw.conductance || raw.vcValue || raw.value)
        : CALCULATION_NA_TEXT,
      judge: calculationTarget ? normalizeJudge(raw.judge || raw.resultJudge) : JUDGE.NA,
      hasModelStandard: Boolean(modelStandard),
      raw,
    };
  });

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
      eqId: response?.eqId || response?.data?.eqId || equipment.eqId,
      fab: response?.fab || response?.data?.fab || equipment.fab,
      model: equipment.modelStandard || response?.model || response?.data?.model || equipment.model,
      constructionNo: equipment.constructionNo,
      site: equipment.site,
      area1: equipment.area1,
      area2: equipment.area2,
    },
    rows: rows.length > 0 ? rows : fallbackRows,
    raw: response,
  };
};
