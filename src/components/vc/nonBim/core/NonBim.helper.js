import {
  CHAMBER_PREFIX,
  EMPTY_TEXT,
  JUDGE,
  MAX_CHAMBER_COUNT,
  PIPE_TYPE,
  PIPE_TYPE_FIELD_POLICY,
} from "./NonBim.constant";

/**
 * 화면 모델 변환 helper.
 *
 * 실제 B/E API가 붙으면 가장 많이 수정할 곳입니다.
 * API 응답 필드명이 회사 DTO 기준으로 확정되면 normalizeDrawing, normalizeSpecOption,
 * normalizeChamberFromRaw, normalizeCalculationResult의 alias를 정리하세요.
 *
 * 화면 컴포넌트와 reducer는 이 helper가 만든 표준 모델만 사용하게 두면,
 * Java/XML Query의 컬럼명이나 응답 wrapper가 바뀌어도 수정 범위를 이 파일로 좁힐 수 있습니다.
 */

export const createId = (prefix = "ID") => {
  // B/E ID가 없는 화면 임시 데이터(row/chamber)를 React key와 선택값으로 쓰기 위한 고유 ID입니다.
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
};

export const toArray = (value) => {
  // API 응답이 단건 객체, 배열, null로 흔들려도 이후 로직은 항상 배열만 다룹니다.
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

export const onlyNumberLike = (value) => {
  // 계산 API에는 숫자형 문자열만 넘기기 위해 입력 단계에서 허용 문자를 제한합니다.
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

  // 배관 유형을 바꾸면 쓰지 않는 컬럼을 비워서 UI의 disabled 상태와 실제 데이터 의미를 맞춥니다.
  // PIPE/REDUCER는 수량을 1로 고정하고, ELBOW는 angle/quantity 중심으로 입력합니다.
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

export const normalizeDrawing = (raw = {}) => {
  const foreline = raw.foreline || raw.forelineDrawing || {};

  // B/E 수기 도면 조회 API 응답을 첫 번째 그리드 row 모델로 변환합니다.
  // 회사 DTO 필드명이 확정되면 raw.* alias를 줄이고 표준 필드명 하나로 정리하세요.

  // B/E 필드명이 확정되지 않은 단계라 같은 의미의 후보 필드들을 표준 화면 필드로 흡수합니다.
  // 이후 컴포넌트와 reducer는 normalize된 key만 사용하면 됩니다.
  return {
    id: raw.id || raw.manualDrawingId || raw.drawingId || raw.ifId || raw.constructionNo || createId("DRAWING"),
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

// 회사 공통코드/MDM 응답을 화면 select option으로 맞추는 지점입니다.
// 최종 화면 option은 value/label을 반드시 가져야 하고, Spec 판정용 minSpec/maxSpec을 함께 보관합니다.
export const normalizeSpecOption = (raw = {}) => ({
  value: nvl(raw.value || raw.modelStandard || raw.modelStandardName || raw.specName || raw.cd),
  label: nvl(raw.label || raw.modelStandard || raw.modelStandardName || raw.specName || raw.cdNm || raw.cd),
  minSpec: nvl(raw.minSpec || raw.min || raw.minValue),
  maxSpec: nvl(raw.maxSpec || raw.max || raw.maxValue),
  raw,
});

export const normalizeSpecOptions = (rawList) =>
  toArray(rawList).map(normalizeSpecOption).filter((item) => item.value || item.label);

export const normalizeChamberFromRaw = (raw = {}, index = 0, parentDrawing = {}) => {
  const fallbackSpecOptions = normalizeSpecOptions(parentDrawing.specOptions);
  const specOptions = normalizeSpecOptions(raw.specOptions || raw.modelStandardOptions || raw.specList);
  const mergedSpecOptions = specOptions.length > 0 ? specOptions : fallbackSpecOptions;
  const firstSpec = mergedSpecOptions[0] || null;
  const rawPipeRows = toArray(raw.pipeRows || raw.pipeList || raw.parts);

  // Chamber별 spec 목록이 없으면 도면의 spec 목록을 상속하고, pipe row가 없으면 빈 row 하나를 준비합니다.
  // 이렇게 하면 선택 직후에도 사용자가 바로 입력/수정할 수 있습니다.
  return {
    id: raw.id || raw.chamberId || createId("CHAMBER"),
    chamberId: nvl(raw.chamberId || raw.chId || raw.id),
    name: shortenChamberName(raw.name || raw.chamberName || raw.chNm, createChamberName(index + 1)),
    modelStandard: nvl(raw.modelStandard || raw.modelStandardName || firstSpec?.value),
    minSpec: nvl(raw.minSpec || firstSpec?.minSpec),
    maxSpec: nvl(raw.maxSpec || firstSpec?.maxSpec),
    processLarge: nvl(raw.processLarge || parentDrawing.processLarge),
    processMiddle: nvl(raw.processMiddle || parentDrawing.processMiddle),
    isSpecSkipped: false,
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

  // 도면 응답에 Chamber 상세가 있으면 그 값을 우선 사용하고, 없으면 chamberCount만큼 기본 Chamber를 만듭니다.
  // MAX_CHAMBER_COUNT는 화면 탭과 payload가 과도하게 커지지 않도록 하는 상한입니다.
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

  // 사용자가 추가한 Chamber는 원본 도면에서 온 locked Chamber와 달리 삭제 가능해야 합니다.
  return {
    ...base,
    id: createId("CHAMBER"),
    chamberId: "",
    locked: false,
  };
};

export const applySpecToChamber = (chamber, modelStandardValue) => {
  const spec = toArray(chamber?.specOptions).find(
    (item) => item.value === modelStandardValue || item.label === modelStandardValue
  );

  // 모델 관리 기준 선택값과 Min/Max Spec은 한 세트이므로 선택 변경 시 함께 갱신합니다.
  return {
    ...chamber,
    modelStandard: modelStandardValue,
    minSpec: spec ? spec.minSpec : "",
    maxSpec: spec ? spec.maxSpec : "",
    isSpecSkipped: false,
  };
};

export const buildFileDownloadName = (drawing = {}) => {
  if (drawing.foreline?.fileName) return drawing.foreline.fileName;
  return `${drawing.eqId || "EQ"}_${drawing.constructionNo || "DRAWING"}_Foreline`;
};

export const downloadBlob = (blob, fileName) => {
  if (!blob || typeof window === "undefined") return;

  // 브라우저 다운로드는 임시 object URL과 anchor click으로 처리하고 즉시 URL을 해제합니다.
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

  // 필수 컬럼은 PIPE_TYPE_FIELD_POLICY에서 가져와 유형 정책 변경 시 검증도 같이 따라가게 합니다.
  const missingFields = policy.requiredFields.filter((fieldName) => {
    const value = row[fieldName];
    return value === undefined || value === null || value === "";
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

export const validateNonBimBeforeCalculate = ({ selectedDrawing, chambers }) => {
  // Non-BIM 계산은 선택 도면의 장비/공정 정보가 payload 기본값이므로 도면 선택을 먼저 요구합니다.
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

export const buildNonBimCalculatePayload = (state) => {
  const selectedDrawing = state.selectedDrawing;
  const activeChamber =
    toArray(state.chambers).find((chamber) => chamber.id === state.activeChamberId) ||
    toArray(state.chambers)[0] ||
    {};

  // Non-BIM 계산 API로 보낼 Java DTO 초안입니다.
  // B/E 요청 DTO가 확정되면 key 이름만 맞추고, 화면 state 구조는 그대로 유지하는 편이 좋습니다.
  // 화면 state를 B/E 계산 API의 source/equipment/chambers 구조로 변환합니다.
  // equipment의 modelStandard는 대표값으로 activeChamber 기준을 쓰고, 실제 판정은 chamber별 spec으로 수행됩니다.
  return {
    sourceType: "NON_BIM",
    manualDrawingId: selectedDrawing?.id,
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
      modelStandard: chamber.modelStandard,
      minSpec: chamber.minSpec,
      maxSpec: chamber.maxSpec,
      isSpecSkipped: chamber.isSpecSkipped,
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

export const buildCalculatorCalculatePayload = (state) => {
  const equipment = state.equipment || {};

  // 독립 Calculator 계산 API로 보낼 Java DTO 초안입니다.
  // 도면이 없다는 점만 다르고, 결과 팝업을 공용으로 쓰기 위해 Non-BIM 계산과 rows 응답 구조를 맞춥니다.
  // 단독 계산기는 도면이 없으므로 수동 입력값을 장비 기본정보로 구성합니다.
  // 모델 기준이 없으면 Spec Skip처럼 처리되어 결과 판정이 NONE이 됩니다.
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
      chamberName: createChamberName(index + 1),
      modelStandard: equipment.modelStandard,
      minSpec: equipment.minSpec,
      maxSpec: equipment.maxSpec,
      isSpecSkipped: !equipment.modelStandard,
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
  // API가 SPEC_IN, HIGH_OUT 등으로 내려줘도 화면 badge는 표준 JUDGE 코드만 사용합니다.
  if (!value) return JUDGE.NONE;
  const upper = String(value).toUpperCase();
  if (upper === "IN" || upper === "SPEC_IN") return JUDGE.IN;
  if (upper.includes("HIGH")) return JUDGE.HIGH_OUT;
  if (upper.includes("LOW")) return JUDGE.LOW_OUT;
  if (upper === "PENDING") return JUDGE.PENDING;
  return value;
};

export const hasSpecOutRows = (rows = []) =>
  toArray(rows).some((row) => row.judge === JUDGE.HIGH_OUT || row.judge === JUDGE.LOW_OUT);

export const hasSpecBounds = (row = {}) => Boolean(row.minSpec || row.maxSpec);

export const shouldShowSpecColumns = (row = {}) => hasSpecBounds(row);

export const normalizeCalculationResult = (response, payload) => {
  // B/E 계산 API 응답을 결과 팝업 그리드 row 모델로 변환합니다.
  // Java/XML Query 결과 컬럼명이 확정되면 raw.* alias를 정리하고 rows 위치도 표준 wrapper에 맞추세요.
  // 계산 결과 row 위치가 response.data.rows, response.result.rows 등으로 달라질 수 있어 후보 경로를 모두 확인합니다.
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

    // 결과 row에 빠진 값은 요청 payload의 chamber 값으로 보강해 팝업 표가 비어 보이지 않도록 합니다.
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
      conductance: nvl(raw.conductance || raw.vcValue || raw.value),
      judge: normalizeJudge(raw.judge || raw.resultJudge),
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
    conductance: "",
    judge: chamber.isSpecSkipped || (!chamber.minSpec && !chamber.maxSpec) ? JUDGE.NONE : JUDGE.PENDING,
    hasModelStandard: Boolean(chamber.modelStandard),
    raw: {},
  }));

  const equipment = payload?.equipment || {};

  // B/E가 아직 계산 row를 내려주지 않는 경우에도 fallbackRows로 Chamber별 Pending 결과를 보여줍니다.
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
