/**
 * V/C Simulation API adapter.
 *
 * 현재 파일은 UI 기능 검증을 위한 mock API입니다.
 * 회사 프로젝트에 붙일 때는 이 파일을 실제 HTTP client 호출로 교체하면 됩니다.
 *
 * 전환 원칙
 * 1. 화면과 saga는 vcSimApi의 함수명만 알고 있게 둡니다.
 * 2. URL, HTTP method, request/response DTO 변경은 이 파일에서 흡수합니다.
 * 3. B/E 응답 필드명이 화면 모델과 다르면 NonBim.helper.js의 normalize 함수에서 변환합니다.
 * 4. 공통코드/콤보 데이터는 최종적으로 { value, label, raw? } 형태가 되도록 맞춥니다.
 *
 * B/E 개발자에게 전달할 상세 API 계약은 README.md의 "B/E 개발 요청 API" 섹션을 참고하세요.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 실제 B/E 연동 전 화면 동작을 검증하기 위한 샘플 도면 데이터입니다.
// 필드명은 helper의 normalize 함수가 여러 B/E 후보명을 흡수하는지 확인할 수 있게 일부러 섞어두었습니다.
const sampleDrawings = [
  {
    id: "DWG-ETCH-001",
    constructionNo: "VC-2026-ETCH-001",
    eqId: "EQ-VAC-ETCH-1001",
    site: "Pyeongtaek",
    fab: "P3",
    area1: "ETCH",
    area2: "BAY-12",
    changeType: "New Install",
    equipmentType: "Etcher",
    requestStatus: "Ready",
    model: "VX-ETCH-300",
    mainMaker: "HanVac Systems",
    processLarge: "ETCH",
    processMiddle: "Metal Etch",
    chamberCount: 3,
    specOptions: [
      { value: "ETCH-LINE-A", label: "ETCH-LINE-A / General", minSpec: "35", maxSpec: "72" },
      { value: "ETCH-LINE-H", label: "ETCH-LINE-H / High Flow", minSpec: "55", maxSpec: "95" },
      { value: "ETCH-LINE-S", label: "ETCH-LINE-S / Strict", minSpec: "42", maxSpec: "58" },
    ],
    chambers: [
      {
        chamberId: "CH-ETCH-A",
        chamberName: "Ch01 Main Process",
        modelStandard: "ETCH-LINE-A",
        minSpec: "35",
        maxSpec: "72",
        processLarge: "ETCH",
        processMiddle: "Metal Etch",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "4", pipeLength: "1200", qty: "1" },
          { pipeType: "ELBOW", inletDia: "4", angle: "90", qty: "2" },
          { pipeType: "REDUCER", inletDia: "4", pipeLength: "280", outletDia: "3", qty: "1" },
        ],
      },
      {
        chamberId: "CH-ETCH-B",
        chamberName: "Ch02 Side Pump",
        modelStandard: "ETCH-LINE-S",
        minSpec: "42",
        maxSpec: "58",
        processLarge: "ETCH",
        processMiddle: "Metal Etch",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "3", pipeLength: "760", qty: "1" },
          { pipeType: "ELBOW", inletDia: "3", angle: "45", qty: "1" },
        ],
      },
      {
        chamberId: "CH-ETCH-C",
        chamberName: "Ch03 Exhaust",
        modelStandard: "ETCH-LINE-H",
        minSpec: "55",
        maxSpec: "95",
        processLarge: "ETCH",
        processMiddle: "Metal Etch",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "6", pipeLength: "1400", qty: "1" },
          { pipeType: "ELBOW", inletDia: "6", angle: "90", qty: "3" },
        ],
      },
    ],
    foreline: {
      categoryName: "Foreline P&ID",
      registeredAt: "2026-05-28",
      registeredBy: "K. Lee",
      fileName: "EQ-VAC-ETCH-1001_foreline_revA.pdf",
    },
  },
  {
    id: "DWG-CVD-002",
    constructionNo: "VC-2026-CVD-014",
    eqId: "EQ-VAC-CVD-2204",
    site: "Hwaseong",
    fab: "H2",
    area1: "CVD",
    area2: "BAY-03",
    changeType: "Modify",
    equipmentType: "CVD Reactor",
    requestStatus: "In Review",
    model: "CV-Pro-12",
    mainMaker: "NeoVac",
    processLarge: "CVD",
    processMiddle: "Deposition",
    chamberCount: 2,
    specOptions: [
      { value: "CVD-STD-LOW", label: "CVD-STD-LOW / Narrow", minSpec: "28", maxSpec: "46" },
      { value: "CVD-STD-MID", label: "CVD-STD-MID / Normal", minSpec: "40", maxSpec: "78" },
    ],
    chambers: [
      {
        chamberId: "CH-CVD-A",
        chamberName: "Ch01 Reactor",
        modelStandard: "CVD-STD-LOW",
        minSpec: "28",
        maxSpec: "46",
        processLarge: "CVD",
        processMiddle: "Deposition",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "2", pipeLength: "2400", qty: "1" },
          { pipeType: "ELBOW", inletDia: "2", angle: "90", qty: "4" },
        ],
      },
      {
        chamberId: "CH-CVD-B",
        chamberName: "Ch02 Loadlock",
        modelStandard: "CVD-STD-MID",
        minSpec: "40",
        maxSpec: "78",
        processLarge: "CVD",
        processMiddle: "Deposition",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "5", pipeLength: "680", qty: "1" },
          { pipeType: "REDUCER", inletDia: "5", pipeLength: "220", outletDia: "4", qty: "1" },
        ],
      },
    ],
    foreline: {
      categoryName: "Foreline ISO",
      registeredAt: "2026-05-30",
      registeredBy: "M. Park",
      fileName: "EQ-VAC-CVD-2204_foreline_modB.pdf",
    },
  },
  {
    id: "DWG-PUMP-003",
    constructionNo: "VC-2026-PUMP-021",
    eqId: "EQ-VAC-PUMP-3307",
    site: "Giheung",
    fab: "G1",
    area1: "UTILITY",
    area2: "PUMP-RM",
    changeType: "Relocation",
    equipmentType: "Pump Line",
    requestStatus: "Draft",
    model: "",
    mainMaker: "K-Vac",
    processLarge: "UTILITY",
    processMiddle: "Vacuum Pump",
    chamberCount: 1,
    specOptions: [
      { value: "PUMP-RACK-A", label: "PUMP-RACK-A / Wide", minSpec: "20", maxSpec: "120" },
      { value: "NO-SPEC", label: "Spec not applied", minSpec: "", maxSpec: "" },
    ],
    chambers: [
      {
        chamberId: "CH-PUMP-A",
        chamberName: "Ch01 Shared Pump",
        modelStandard: "",
        minSpec: "",
        maxSpec: "",
        processLarge: "UTILITY",
        processMiddle: "Vacuum Pump",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "8", pipeLength: "3200", qty: "1" },
          { pipeType: "ELBOW", inletDia: "8", angle: "90", qty: "5" },
          { pipeType: "REDUCER", inletDia: "8", pipeLength: "450", outletDia: "6", qty: "1" },
        ],
      },
    ],
    foreline: {
      categoryName: "As-built Foreline",
      registeredAt: "2026-06-01",
      registeredBy: "S. Choi",
      fileName: "EQ-VAC-PUMP-3307_asbuilt.pdf",
    },
  },
  {
    id: "DWG-TEST-004",
    constructionNo: "VC-2026-TEST-099",
    eqId: "EQ-VAC-TEST-9009",
    site: "Cheonan",
    fab: "T1",
    area1: "TEST",
    area2: "LAB-07",
    changeType: "Spec Check",
    equipmentType: "Lab Chamber",
    requestStatus: "Ready",
    model: "LabVC-Mini",
    mainMaker: "Preview Lab",
    processLarge: "RND",
    processMiddle: "Validation",
    chamberCount: 1,
    specOptions: [
      { value: "LAB-TIGHT", label: "LAB-TIGHT / Low Out test", minSpec: "85", maxSpec: "100" },
      { value: "LAB-HIGH", label: "LAB-HIGH / High Out test", minSpec: "5", maxSpec: "25" },
    ],
    chambers: [
      {
        chamberId: "CH-LAB-A",
        chamberName: "Ch01 Spec Boundary",
        modelStandard: "LAB-TIGHT",
        minSpec: "85",
        maxSpec: "100",
        processLarge: "RND",
        processMiddle: "Validation",
        pipeRows: [
          { pipeType: "PIPE", inletDia: "2", pipeLength: "1800", qty: "1" },
          { pipeType: "REDUCER", inletDia: "2", pipeLength: "200", outletDia: "1", qty: "1" },
        ],
      },
    ],
    foreline: {
      categoryName: "Test Drawing",
      registeredAt: "2026-06-03",
      registeredBy: "Preview",
      fileName: "EQ-VAC-TEST-9009_boundary.pdf",
    },
  },
];

export const VC_SIM_ENDPOINTS = {
  // 회사 Controller URL이 확정되면 여기만 먼저 바꾸고, 아래 함수의 HTTP method/query/body를 맞춥니다.
  searchEqSuggestions: "/api/vc/sim/non-bim/equipments",
  searchManualDrawings: "/api/vc/sim/non-bim/manual-drawings",
  downloadForelineDrawing: "/api/vc/sim/non-bim/foreline-drawing/download",
  calculateNonBim: "/api/vc/sim/non-bim/calculate",
  equipmentSpecOptions: "/api/vc/sim/non-bim/equipment-spec-options",
  calculatorOptions: "/api/vc/sim/calculator/options",
  calculateVcCalculator: "/api/vc/sim/calculator/calculate",
  saveVcResult: "/api/vc/sim/result/save",
};

const calculatorOptions = {
  // Calculator 화면의 초기 선택지입니다. 운영에서는 getCalculatorOptions API 응답으로 대체됩니다.
  fabs: [
    { value: "P3", label: "P3" },
    { value: "H2", label: "H2" },
    { value: "G1", label: "G1" },
    { value: "T1", label: "T1" },
  ],
  models: [
    { value: "VX-ETCH-300", label: "VX-ETCH-300" },
    { value: "CV-Pro-12", label: "CV-Pro-12" },
    { value: "Pump Rack 8", label: "Pump Rack 8" },
    { value: "LabVC-Mini", label: "LabVC-Mini" },
  ],
  modelStandards: [
    { value: "ETCH-LINE-A", label: "ETCH-LINE-A / General", minSpec: "35", maxSpec: "72" },
    { value: "CVD-STD-MID", label: "CVD-STD-MID / Normal", minSpec: "40", maxSpec: "78" },
    { value: "PUMP-RACK-A", label: "PUMP-RACK-A / Wide", minSpec: "20", maxSpec: "120" },
    { value: "LAB-TIGHT", label: "LAB-TIGHT / Strict", minSpec: "85", maxSpec: "100" },
  ],
};

const numberValue = (value) => {
  // 빈 값이나 숫자가 아닌 값은 미리보기 계산에서 0으로 취급합니다.
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateConductance = (pipeList = []) => {
  // 실제 물리 계산식이 확정되기 전의 미리보기용 점수식입니다.
  // 배관 유형별 입력값이 결과/판정 흐름에 반영되는지 확인하는 목적입니다.
  const score = pipeList.reduce((total, row) => {
    const inlet = numberValue(row.inletDiameter);
    const outlet = numberValue(row.outletDiameter) || inlet;
    const length = numberValue(row.length);
    const angle = numberValue(row.angle);
    const quantity = numberValue(row.quantity) || 1;

    if (row.type === "ELBOW") {
      return total + inlet * 6 - angle * 0.06 - quantity * 2.2;
    }

    if (row.type === "REDUCER") {
      return total + outlet * 7 - length * 0.01 - Math.max(inlet - outlet, 0) * 2.5;
    }

    return total + inlet * 9 - length * 0.012;
  }, 0);

  return Math.max(score, 1);
};

const judgeConductance = ({ conductance, minSpec, maxSpec, isSpecSkipped }) => {
  // Spec이 없거나 Skip이면 판정 대상이 아니므로 NONE, 범위를 벗어나면 LOW/HIGH_OUT으로 표시합니다.
  if (isSpecSkipped) return "NONE";
  const min = numberValue(minSpec);
  const max = numberValue(maxSpec);

  if (!min && !max) return "NONE";
  if (min && conductance < min) return "LOW_OUT";
  if (max && conductance > max) return "HIGH_OUT";
  return "IN";
};

export const vcSimApi = {
  async searchEqSuggestions(keyword) {
    // 실제 연동: GET equipment autocomplete API.
    // B/E query parameter 예시: { keyword }
    // 화면 자동완성은 응답을 { value, label, raw }로 변환해 사용합니다.
    // datalist 자동완성용 간단 검색입니다. 실제 API에서는 keyword query parameter로 대체됩니다.
    // 호출 saga: fetchEqSuggestionsFlow
    // 반환 형태: saga가 { value, label, raw }로 다시 감싸므로 eqId/equipmentId/value 중 하나만 있어도 됩니다.
    await sleep(120);
    const needle = String(keyword || "").toLowerCase();

    return sampleDrawings
      .filter((item) => !needle || item.eqId.toLowerCase().includes(needle))
      .map((item) => ({
        eqId: item.eqId,
        constructionNo: item.constructionNo,
        label: `${item.eqId} (${item.fab} / ${item.area1})`,
      }));
  },

  async searchManualDrawings(params = {}) {
    // 실제 연동: GET manual drawing list API.
    // B/E query parameter 예시: { eqId, constructionNo, page?, size?, sort? }
    // 응답은 normalizeDrawingList에서 그리드 row 모델로 변환합니다.
    // 검색값이 없거나 결과가 없을 때도 미리보기 화면이 비지 않도록 샘플 전체를 fallback으로 반환합니다.
    // 호출 saga: fetchManualDrawingsFlow
    // 반환 형태: helper.normalizeDrawingList가 표준 도면 row로 변환합니다.
    await sleep(250);
    const eqId = String(params.eqId || "").toLowerCase();
    const constructionNo = String(params.constructionNo || "").toLowerCase();

    const filtered = sampleDrawings.filter((item) => {
      const matchesEq = !eqId || item.eqId.toLowerCase().includes(eqId);
      const matchesConstruction =
        !constructionNo || item.constructionNo.toLowerCase().includes(constructionNo);
      return matchesEq && matchesConstruction;
    });

    return filtered.length ? filtered : sampleDrawings;
  },

  async downloadForelineDrawing({ drawingKey, constructionNo }) {
    // 실제 연동: GET file download API.
    // B/E는 Blob/Stream/ArrayBuffer로 파일을 내려주고 Content-Disposition에 파일명을 포함하는 것이 좋습니다.
    // 미리보기에서는 PDF 대신 텍스트 Blob을 내려 실제 다운로드 흐름만 검증합니다.
    // 호출 saga: downloadForelineFlow
    // 실제 연동 시에는 drawingId/fileId로 파일 API를 호출하고 Blob 또는 ArrayBuffer를 반환하면 됩니다.
    await sleep(120);
    const drawing = sampleDrawings.find((item) => item.id === drawingKey || item.constructionNo === constructionNo);

    return new Blob(
      [
        "V/C Simulation preview file\n",
        `Drawing Key: ${drawingKey || "-"}\n`,
        `EQ ID: ${drawing?.eqId || "-"}\n`,
        `Construction No.: ${drawing?.constructionNo || "-"}\n`,
      ],
      { type: "text/plain;charset=utf-8" }
    );
  },

  async getEquipmentSpecOptions({ eqId, fab, model, drawingKey, constructionNo }) {
    // 실제 연동: GET equipment/model standard options API.
    // 회사 MDM/공통코드 응답이 어떤 형태이든 최종 option은 { value, label, minSpec, maxSpec, raw? }로 맞춥니다.
    // 도면 선택 후 해당 장비/모델에 맞는 Model Standard 후보를 가져오는 API 역할입니다.
    // 호출 saga: fetchModelStandardOptionsFlow
    // 반환 형태: helper.normalizeSpecOptions가 value/label/minSpec/maxSpec으로 표준화할 수 있는 배열입니다.
    await sleep(180);
    const drawing = sampleDrawings.find(
      (item) =>
        item.id === drawingKey ||
        item.constructionNo === constructionNo ||
        item.eqId === eqId ||
        (item.fab === fab && item.model === model)
    );

    return drawing?.specOptions || [];
  },

  async calculateNonBim(payload) {
    // 실제 연동: POST Non-BIM calculation API.
    // payload는 NonBim.helper.js의 buildNonBimCalculatePayload에서 만들어집니다.
    // B/E는 chamber별 conductance와 judge를 rows 배열로 반환하면 됩니다.
    // Non-BIM 계산은 payload.chambers를 그대로 순회해 결과 row를 생성합니다.
    // 호출 saga: nonBimCalculateFlow
    // payload 생성 위치: helper.buildNonBimCalculatePayload
    // 결과 정규화 위치: helper.normalizeCalculationResult
    await sleep(250);

    return {
      data: {
        eqId: payload.equipment.eqId,
        fab: payload.equipment.fab,
        model: payload.equipment.modelStandard || payload.equipment.model,
        rows: payload.chambers.map((chamber, index) => {
          if (chamber.calculationTarget === false) {
            return {
              id: `RESULT-${index + 1}`,
              chamberId: chamber.chamberId || `VC-${Date.now()}-${index + 1}`,
              chamberName: chamber.chamberName,
              confirmFlag: "N",
              processLarge: chamber.processLarge,
              processMiddle: chamber.processMiddle,
              modelStandard: chamber.modelStandard,
              minSpec: chamber.minSpec,
              maxSpec: chamber.maxSpec,
              conductance: "N/A",
              judge: "NA",
            };
          }

          const conductance = calculateConductance(chamber.pipeList);
          const judge = judgeConductance({
            conductance,
            minSpec: chamber.minSpec,
            maxSpec: chamber.maxSpec,
            isSpecSkipped: chamber.isSpecSkipped,
          });

          return {
            id: `RESULT-${index + 1}`,
            chamberId: chamber.chamberId || `VC-${Date.now()}-${index + 1}`,
            chamberName: chamber.chamberName,
            confirmFlag: "N",
            processLarge: chamber.processLarge,
            processMiddle: chamber.processMiddle,
            modelStandard: chamber.modelStandard,
            minSpec: chamber.minSpec,
            maxSpec: chamber.maxSpec,
            conductance: conductance.toFixed(2),
            judge,
          };
        }),
      },
    };
  },

  async getCalculatorOptions() {
    // 실제 연동: GET calculator initial option API.
    // 회사 공통코드 규칙이 있으면 여기에서 호출하고 options.fabs/models/modelStandards 형태로 변환합니다.
    // 호출 saga: calculatorInitFlow
    // Calculator 화면 select box에 들어갈 Fab/Model/Model Standard 후보를 반환합니다.
    await sleep(120);
    return calculatorOptions;
  },

  async calculateVcCalculator(payload) {
    // 실제 연동: POST standalone calculator API.
    // Non-BIM 계산과 같은 결과 row 구조를 쓰면 결과 팝업을 공용으로 유지할 수 있습니다.
    // Calculator 계산도 같은 결과 포맷을 반환해 공용 결과 팝업을 재사용합니다.
    // 호출 saga: vcCalculatorCalculateFlow
    // payload 생성 위치: helper.buildCalculatorCalculatePayload
    await sleep(250);

    return {
      data: {
        eqId: payload.equipment.eqId,
        fab: payload.equipment.fab,
        model: payload.equipment.modelStandard || payload.equipment.model,
        rows: payload.chambers.map((chamber, index) => {
          if (chamber.calculationTarget === false) {
            return {
              id: `CALC-RESULT-${index + 1}`,
              chamberId: chamber.chamberId || `CALC-CH-${index + 1}`,
              chamberName: chamber.chamberName,
              confirmFlag: "N",
              processLarge: chamber.processLarge,
              processMiddle: chamber.processMiddle,
              modelStandard: chamber.modelStandard,
              minSpec: chamber.minSpec,
              maxSpec: chamber.maxSpec,
              conductance: "N/A",
              judge: "NA",
            };
          }

          const conductance = calculateConductance(chamber.pipeList);
          const judge = judgeConductance({
            conductance,
            minSpec: chamber.minSpec,
            maxSpec: chamber.maxSpec,
            isSpecSkipped: chamber.isSpecSkipped,
          });

          return {
            id: `CALC-RESULT-${index + 1}`,
            chamberId: chamber.chamberId || `CALC-CH-${index + 1}`,
            chamberName: chamber.chamberName,
            confirmFlag: "N",
            processLarge: chamber.processLarge,
            processMiddle: chamber.processMiddle,
            modelStandard: chamber.modelStandard,
            minSpec: chamber.minSpec,
            maxSpec: chamber.maxSpec,
            conductance: conductance.toFixed(2),
            judge,
          };
        }),
      },
    };
  },

  async saveVcResult(payload) {
    // 실제 연동: POST result save API.
    // sourceType, basicInfo, rows, draft를 Java DTO에 맞춰 저장합니다.
    // Spec Out 기안 첨부 필드가 회사 결재/문서 시스템과 연결된다면 여기에서 DTO를 변환합니다.
    // 저장 API mock입니다. 기안 첨부 여부와 row 개수를 응답해 저장 완료 메시지 확인에 사용합니다.
    // 호출 saga: saveResultFlow
    // payload.draft는 Spec Out 기안 첨부 팝업 입력값이며, Calculator 저장에서는 비어 있을 수 있습니다.
    await sleep(250);

    // B/E 저장 API도 저장 성공 후 Manual Drawing Results에 반영할 nextStatus/requestStatus를 반환해야 합니다.
    // 조회 API의 requestStatus와 같은 값이면 저장 직후/재조회 후 Calculate 노출 기준이 일관됩니다.
    const draftAttached = Boolean(payload.draft?.attachmentName || payload.draft?.title);

    return {
      savedId: `VC-SAVE-${Date.now()}`,
      sourceType: payload.sourceType,
      savedAt: new Date().toISOString(),
      rowCount: payload.rows?.length || 0,
      draftAttached,
      nextStatus: draftAttached ? "Draft Attached" : "Saved",
    };
  },
};

export default vcSimApi;
