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
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });

try {
  // Load real helper/reducer/action modules through Vite so JSX/ESM imports behave like the app.
  const helper = await vite.ssrLoadModule("/src/components/vc/nonBim/core/NonBim.helper.js");
  const nonBimModule = await vite.ssrLoadModule("/src/store/vc/nonBim/reducer.js");
  const nonBimActionModule = await vite.ssrLoadModule("/src/store/vc/nonBim/action.js");
  const calculatorModule = await vite.ssrLoadModule("/src/store/vc/vcCalculator/reducer.js");
  const calculatorActionModule = await vite.ssrLoadModule("/src/store/vc/vcCalculator/action.js");

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
