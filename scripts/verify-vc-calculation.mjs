import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";

/**
 * Development-only verification script for V/C screen business rules.
 *
 * This file is not imported by the React app and is not part of the runtime bundle.
 * `package.json` runs it through `npm run test:vc` so we can catch regressions before
 * moving the F/E source into the company system.
 *
 * Why .mjs?
 * The project uses Vite/ES modules, so this script uses native Node ESM and Vite's
 * `ssrLoadModule` to load the same `.js` source files that the screen uses.
 */
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true },
});

try {
  // Load real helper/reducer/action modules through Vite so JSX/ESM imports behave like the app.
  const helper = await vite.ssrLoadModule("/src/components/vc/nonBim/core/NonBim.helper.js");
  const nonBimModule = await vite.ssrLoadModule("/src/store/vc/nonBim/reducer.js");
  const nonBimActionModule = await vite.ssrLoadModule("/src/store/vc/nonBim/action.js");
  const calculatorModule = await vite.ssrLoadModule("/src/store/vc/vcCalculator/reducer.js");
  const calculatorActionModule = await vite.ssrLoadModule("/src/store/vc/vcCalculator/action.js");
  const specModule = await vite.ssrLoadModule("/src/store/vc/spec/reducer.js");
  const specActionModule = await vite.ssrLoadModule("/src/store/vc/spec/action.js");
  const specSelectorModule = await vite.ssrLoadModule("/src/store/vc/specSelector.js");
  const specCoreModule = await vite.ssrLoadModule("/src/components/vc/admin/spec/core/SpecMgmt.core.js");
  const drawingGridModule = await vite.ssrLoadModule("/src/components/vc/nonBim/core/DrawingGrid.core.js");

  // SpecMaster radio와 paging은 서버 계약과 분리한다.
  const specMasters = Array.from({ length: 32 }, (_, index) => ({
    specId: `MASTER-${index + 1}`,
    upperCd: "",
  }));
  const specDetails = specMasters.flatMap((master, index) => [
    { specId: `DETAIL-${index + 1}-1`, upperCd: master.specId },
    { specId: `DETAIL-${index + 1}-2`, upperCd: master.specId },
  ]);
  let specState = specModule.default(
    specModule.initialSpecMasterState,
    specActionModule.default.searchSuccess({
      rows: specMasters,
      details: specDetails,
      selectedSpecId: "MASTER-11",
      selectedDetailSpecId: "DETAIL-11-2",
    })
  );
  assert.equal(specState.selectedSpecId, "MASTER-11");
  assert.equal(specState.selectedDetailSpecId, "DETAIL-11-2");
  specState = specModule.default(specState, specActionModule.default.selectMaster("MASTER-12"));
  assert.equal(specState.selectedSpecId, "MASTER-12");
  assert.equal(specState.selectedDetailSpecId, "");
  assert.deepEqual(specState.detailRows, []);
  specState = specModule.default(
    specState,
    specActionModule.default.searchSuccess({
      rows: specMasters,
      details: specDetails.filter((row) => row.upperCd === "MASTER-12"),
      selectedSpecId: "MASTER-12",
      selectedDetailSpecId: "",
    })
  );
  assert.equal(specState.selectedDetailSpecId, "DETAIL-12-1");
  const restoreDetailAction = specActionModule.default.selectMaster("MASTER-12", "DETAIL-12-2");
  assert.equal(restoreDetailAction.payload.selectedDetailSpecId, "DETAIL-12-2");
  specState = specModule.default(
    specState,
    specActionModule.default.searchSuccess({
      rows: specMasters,
      details: specDetails.filter((row) => row.upperCd === "MASTER-12"),
      selectedSpecId: restoreDetailAction.payload.specId,
      selectedDetailSpecId: restoreDetailAction.payload.selectedDetailSpecId,
    })
  );
  assert.equal(specState.selectedDetailSpecId, "DETAIL-12-2");
  assert.deepEqual(
    specSelectorModule.selectSpecMgmtSelectedDetailRows({ vc: { specMaster: specState } }).map((row) => row.specId),
    ["DETAIL-12-1", "DETAIL-12-2"]
  );
  assert.equal(specCoreModule.MASTER_PAGE_SIZE, 10);
  assert.equal(specCoreModule.DETAIL_PAGE_SIZE, 10);
  assert.equal(specCoreModule.getPagedRowNumber(0, 10, 0), 1);
  assert.equal(specCoreModule.getPagedRowNumber(1, 10, 0), 11);
  assert.equal(specCoreModule.getPagedRowNumber(3, 10, 1), 32);
  assert.equal(specCoreModule.getPageForRow(specMasters, "MASTER-16", 10), 1);
  assert.equal(specCoreModule.getPageForRow(specMasters, "MASTER-32", 10), 3);

  // 기존 첫 Master도 수정 팝업에서 AREA/MAKER/MODEL 의존값이 즉시 채워져야 한다.
  specState = specModule.default(
    specState,
    specActionModule.default.initSuccess({
      areasByFab: { M12: [{ value: "M12A", label: "M12A" }] },
      makersByArea: { M12A: [{ value: "AMAT", label: "AMAT" }] },
      modelsByMaker: { AMAT: [{ value: "CVD-Legacy-2", label: "CVD-Legacy-2" }] },
    })
  );
  specState = specModule.default(
    { ...specState, masterRows: [{ specId: "MASTER-M12", fabId: "M12", setModelNm: "CVD-Legacy-2" }], selectedSpecId: "MASTER-M12" },
    specActionModule.default.openEditPopup({
      scope: "master",
      row: { specId: "MASTER-M12", fabId: "M12", setModelNm: "CVD-Legacy-2" },
    })
  );
  assert.equal(specState.popup.form.area, "M12A");
  assert.equal(specState.popup.form.maker, "AMAT");

  // Manual Drawing Results는 전체 조회 결과를 5행 paging과 컬럼 필터로 처리한다.
  const drawingGridRows = Array.from({ length: 11 }, (_, index) => ({
    woId: `WO-${String(index + 1).padStart(2, "0")}`,
    eqId: index < 7 ? "EQ-ETCH" : "EQ-CVD",
    fabCd: index % 2 === 0 ? "M16" : "M15",
    requestStatus: index % 3 === 0 ? "Ready" : "In Review",
  }));
  assert.equal(drawingGridModule.DRAWING_PAGE_SIZE, 4);
  assert.equal(drawingGridModule.getDrawingTotalPages(drawingGridRows.length), 3);
  assert.equal(drawingGridModule.getDrawingRowNumber(1, 0), 5);
  assert.equal(drawingGridModule.getDrawingRowNumber(2, 2), 11);
  assert.equal(drawingGridModule.getDrawingPage(drawingGridRows, "WO-11"), 2);
  const drawingFilters = drawingGridModule.createDrawingFilters();
  drawingFilters.eqId = "etch";
  const filteredDrawingGridRows = drawingGridModule.filterDrawings(drawingGridRows, drawingFilters);
  assert.equal(filteredDrawingGridRows.length, 7);
  assert.equal(drawingGridModule.getDrawingTotalPages(filteredDrawingGridRows.length), 2);
  assert.deepEqual(
    drawingGridModule.paginateDrawings(filteredDrawingGridRows, 1).map((row) => row.woId),
    ["WO-05", "WO-06", "WO-07"]
  );

  // Reuse the B/E mock design-portal table so F/E tests follow the same WO_ID-based fixture.
  const drawings = fs
    .readFileSync("./vcBePrj/data/DESIGN_PORTAL_MANUAL_DRAWING.txt", "utf8")
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);

  // Guard the BIM/5D Not Applied Fab search condition: FAB options must not disappear.
  const fabOptions = [...new Set(drawings.map((drawing) => drawing.fabCd).filter(Boolean))]
    .sort()
    .map((fabCd) => ({ value: fabCd, label: fabCd }));
  let nonBimOptionsState = nonBimModule.default(
    nonBimModule.initialNonBimState,
    nonBimActionModule.default.initOptionsSuccess({
      fabs: fabOptions,
      pipeTypes: [{ value: "PIPE", label: "Pipe" }],
    })
  );
  assert.deepEqual(nonBimOptionsState.options.fabs.map((option) => option.value), ["M14", "M15", "M16"]);

  // Non-BIM is strict: missing Model Standard/Spec removes the chamber from calculation target.
  for (const drawing of drawings) {
    const normalizedDrawing = helper.normalizeDrawing(drawing);
    let state = nonBimModule.initialNonBimState;
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.fetchManualDrawingsSuccess([normalizedDrawing])
    );
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.selectDrawing(drawing.woId)
    );
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.fetchDrawingChambersSuccess({
        woId: drawing.woId,
        chambers: helper.normalizeChambersFromDrawing({ ...normalizedDrawing, chambers: drawing.chambers }),
      })
    );
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.fetchModelStandardOptionsSuccess({
        woId: drawing.woId,
        options: helper.normalizeSpecOptions(drawing.specOptions),
      })
    );

    const payload = helper.buildNonBimCalculatePayload(state);
    assert.ok(payload.chambers.every((chamber) => chamber.calculationTarget));
    assert.ok(payload.chambers.every((chamber) => chamber.minSpec || chamber.maxSpec));
    const stateAfterAddChamber = nonBimModule.default(state, nonBimActionModule.default.addChamber());
    assert.equal(stateAfterAddChamber.chambers.length, state.chambers.length + 1);
    assert.equal(stateAfterAddChamber.activeChamberId, stateAfterAddChamber.chambers.at(-1).id);

    const activeChamberId = state.activeChamberId;
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.updateChamberField({
        chamberId: activeChamberId,
        name: "modelStandard",
        value: "",
      })
    );
    const clearedChamber = state.chambers.find((chamber) => chamber.id === activeChamberId);
    assert.equal(clearedChamber.calculationTarget, false);
    assert.equal(helper.validateNonBimBeforeCalculate({ selectedDrawing: state.selectedDrawing, chambers: [clearedChamber] }).valid, false);
  }

  // Calculator options are filtered by FAB + MODEL, but each chamber keeps its own Model Standard.
  const options = {
    fabs: [],
    models: [],
    pipeTypes: [],
    modelStandards: [
      { value: "ETCH-LINE-A", label: "ETCH-LINE-A", minSpec: "35", maxSpec: "72", fab: "M16", model: "VX-ETCH-300" },
      { value: "CVD-STD-LOW", label: "CVD-STD-LOW", minSpec: "28", maxSpec: "46", fab: "M15", model: "CV-Pro-12" },
      { value: "CVD-STD-MID", label: "CVD-STD-MID", minSpec: "40", maxSpec: "78", fab: "M15", model: "CV-Pro-12" },
      { value: "PUMP-RACK-A", label: "PUMP-RACK-A", minSpec: "20", maxSpec: "120", fab: "M14", model: "Pump Rack 8" },
    ],
  };

  let calculator = calculatorModule.initialVcCalculatorState;
  calculator = calculatorModule.default(calculator, calculatorActionModule.default.initSuccess(options));
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.setEquipmentField({ name: "fab", value: "M15" })
  );
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.setEquipmentField({ name: "model", value: "CV-Pro-12" })
  );

  assert.equal(calculator.equipment.modelStandard, "CVD-STD-LOW");
  assert.equal(calculator.chambers[0].calculationTarget, true);
  assert.deepEqual(calculator.chambers[0].specOptions.map((option) => option.value), ["CVD-STD-LOW", "CVD-STD-MID"]);

  calculator = calculatorModule.default(calculator, calculatorActionModule.default.addChamber());
  const [firstCalculatorChamber, secondCalculatorChamber] = calculator.chambers;
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.setActiveChamber(secondCalculatorChamber.id)
  );
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.updateChamberField({
      chamberId: secondCalculatorChamber.id,
      name: "modelStandard",
      value: "CVD-STD-MID",
    })
  );
  assert.equal(calculator.chambers.find((chamber) => chamber.id === firstCalculatorChamber.id).modelStandard, "CVD-STD-LOW");
  assert.equal(calculator.chambers.find((chamber) => chamber.id === secondCalculatorChamber.id).modelStandard, "CVD-STD-MID");

  // Calculator is intentionally permissive: target ON + no spec still calculates conductance.
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.updateChamberField({
      chamberId: secondCalculatorChamber.id,
      name: "modelStandard",
      value: "",
    })
  );
  const speclessChamber = calculator.chambers.find((chamber) => chamber.id === secondCalculatorChamber.id);
  const speclessPipeRow = speclessChamber.pipeList[0];
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.updatePipeRow({
      chamberId: speclessChamber.id,
      rowId: speclessPipeRow.id,
      name: "inletDiameter",
      value: "3",
    })
  );
  calculator = calculatorModule.default(
    calculator,
    calculatorActionModule.default.updatePipeRow({
      chamberId: speclessChamber.id,
      rowId: speclessPipeRow.id,
      name: "length",
      value: "760",
    })
  );
  const speclessReadyChamber = calculator.chambers.find((chamber) => chamber.id === secondCalculatorChamber.id);
  assert.equal(speclessChamber.modelStandard, "");
  assert.equal(speclessChamber.calculationTarget, true);
  assert.equal(helper.validateChambersBeforeCalculate([speclessReadyChamber], { allowSpecless: true }).valid, true);
  assert.equal(helper.validateChambersBeforeCalculate([speclessReadyChamber]).valid, false);

  // Target ON means conductance is shown. Missing spec only makes the judge NA.
  const speclessResult = helper.normalizeCalculationResult(
    {
      success: true,
      data: {
        rows: [
          {
            chamberId: speclessReadyChamber.chamberId,
            chamberName: speclessReadyChamber.chamberName,
            conductance: "17.88",
            judge: "NA",
          },
        ],
      },
    },
    helper.buildCalculatorCalculatePayload({ ...calculator, chambers: [speclessReadyChamber] })
  );
  assert.equal(speclessResult.rows[0].conductance, "17.88");
  assert.equal(speclessResult.rows[0].judge, "NA");

  // Target OFF means excluded from calculation display, even when pipe values exist.
  const excludedResult = helper.normalizeCalculationResult(
    {
      success: true,
      data: {
        rows: [
          {
            chamberId: speclessReadyChamber.chamberId,
            chamberName: speclessReadyChamber.chamberName,
            conductance: "17.88",
            judge: "NA",
          },
        ],
      },
    },
    helper.buildCalculatorCalculatePayload({
      ...calculator,
      chambers: [{ ...speclessReadyChamber, calculationTarget: false }],
    })
  );
  assert.equal(excludedResult.rows[0].conductance, "N/A");
  assert.equal(excludedResult.rows[0].judge, "NA");

  // A request with every chamber excluded must be blocked before calling the API.
  const excludedValidation = helper.validateChambersBeforeCalculate(
    calculator.chambers.map((chamber) => ({ ...chamber, calculationTarget: false }))
  );
  assert.equal(excludedValidation.valid, false);

  console.log("V/C calculation state scenarios passed.");
} finally {
  await vite.close();
}
