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

export const isCalculationLockedByDrawingStatus = (status) =>
  CALCULATION_LOCKED_DRAWING_STATUSES.includes(String(status || ""));

// 배관 수치 입력은 숫자와 소수점만 허용합니다. 상세 단위/범위 검증은 B/E 또는 별도 validation에서 확장합니다.
export const onlyNumberLike = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[^\d.]/g, "");
};

export const leftPad2 = (value) => String(value).padStart(2, "0");

// 기본 Chamber명은 Ch01, Ch02처럼 탭에서 짧게 읽히는 형식으로 만듭니다.
export const createChamberName = (seq) => `${CHAMBER_PREFIX}${leftPad2(seq)}`;

// 긴 설비/도면 유래 Chamber명은 탭이 깨지지 않도록 앞 10자만 사용합니다.
export const shortenChamberName = (name, fallback) => {
  const text = String(name || fallback || "").trim();
  return text ? text.slice(0, 10) : fallback;
};

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

export const createEmptyPipeRow = (type = PIPE_TYPE.PIPE) =>
  normalizePipeRowByType({
    id: createId("PIPE_ROW"),
    type,
    quantity: getPipePolicy(type).fixedQuantity || "",
  });

// 수기 도면 조회 응답을 첫 번째 그리드 row 모델로 변환합니다. 화면 선택 키는 constructionNo입니다.
// B/E DTO 필드명이 확정/변경되면 컴포넌트가 아니라 이 함수에서 alias를 흡수합니다.
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
  // mock, REST list, result wrapper 등 응답 wrapper 차이를 한 번에 흡수합니다.
  const data = response?.data || response?.list || response?.result || response || [];
  return toArray(data).map(normalizeDrawing);
};

// Model Standard option은 화면 value/label과 Spec 범위를 함께 가져야 Chamber 산출 가능 여부를 판단할 수 있습니다.
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
// locked=true인 Chamber는 도면 원본에서 온 탭으로 보고 삭제를 막습니다. 사용자가 추가한 Chamber만 unlocked입니다.
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
  // 1순위는 API가 내려준 chamberList입니다. 없으면 chamberCount만큼 기본 탭을 만들어 사용자가 배관을 채울 수 있게 합니다.
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
  // 사용자가 추가한 Chamber도 선택 도면의 공정/Spec option을 기본 상속해 기존 도면 탭과 같은 계산 규칙을 탑니다.
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
  // 서버 파일명이 있으면 그대로 쓰고, 없으면 사용자가 알아볼 수 있는 EQ/공사번호 조합으로 보정합니다.
  if (drawing.foreline?.fileName) return drawing.foreline.fileName;
  return `${drawing.eqId || "EQ"}_${drawing.constructionNo || "DRAWING"}_Foreline`;
};

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
// 장비 기준 Model Standard가 모든 Chamber에 공통 적용되므로 Chamber별 modelStandard 대신 equipment 값을 내려줍니다.
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
  // B/E 응답이 SPEC_IN, HIGH_OUT, high 등으로 달라도 팝업 badge는 JUDGE 표준 코드만 보게 합니다.
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

// Spec 범위가 없는 row는 Min/Max와 판정 컬럼을 '-' 또는 N/A 성격으로 보여줍니다.
export const shouldShowSpecColumns = (row = {}) => hasSpecBounds(row);

// 계산 응답을 Vacuum Conductance Result 공통 팝업 모델로 변환합니다. 산출대상 제외 row는 N/A로 보정합니다.
// API가 rows를 주지 않는 preview/mock 상황에서도 payload의 chambers로 fallbackRows를 만들어 팝업 구조를 유지합니다.
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
