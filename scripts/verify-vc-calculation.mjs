import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });

try {
  const helper = await vite.ssrLoadModule("/src/components/vc/nonBim/core/NonBim.helper.js");
  const nonBimModule = await vite.ssrLoadModule("/src/store/vc/nonBim/reducer.js");
  const nonBimActionModule = await vite.ssrLoadModule("/src/store/vc/nonBim/action.js");
  const calculatorModule = await vite.ssrLoadModule("/src/store/vc/vcCalculator/reducer.js");
  const calculatorActionModule = await vite.ssrLoadModule("/src/store/vc/vcCalculator/action.js");

  const drawings = fs
    .readFileSync("./vcBePrj/data/VC_PORTAL_MANUAL_DRAWING.txt", "utf8")
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);

  for (const drawing of drawings) {
    const normalizedDrawing = helper.normalizeDrawing(drawing);
    let state = nonBimModule.initialNonBimState;
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.fetchManualDrawingsSuccess([normalizedDrawing])
    );
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.selectDrawing(drawing.constructionNo)
    );
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.fetchDrawingChambersSuccess({
        constructionNo: drawing.constructionNo,
        chambers: helper.normalizeChambersFromDrawing({ ...normalizedDrawing, chambers: drawing.chambers }),
      })
    );
    state = nonBimModule.default(
      state,
      nonBimActionModule.default.fetchModelStandardOptionsSuccess({
        constructionNo: drawing.constructionNo,
        options: helper.normalizeSpecOptions(drawing.specOptions),
      })
    );

    const payload = helper.buildNonBimCalculatePayload(state);
    assert.ok(payload.chambers.every((chamber) => chamber.calculationTarget));
    assert.ok(payload.chambers.every((chamber) => chamber.minSpec || chamber.maxSpec));
  }

  const options = {
    fabs: [],
    models: [],
    pipeTypes: [],
    modelStandards: [
      { value: "ETCH-LINE-A", label: "ETCH-LINE-A", minSpec: "35", maxSpec: "72", fab: "M16", model: "VX-ETCH-300" },
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

  assert.equal(calculator.equipment.modelStandard, "CVD-STD-MID");
  assert.equal(calculator.chambers[0].calculationTarget, true);
  assert.deepEqual(calculator.chambers[0].specOptions.map((option) => option.value), ["CVD-STD-MID"]);

  const excludedValidation = helper.validateChambersBeforeCalculate(
    calculator.chambers.map((chamber) => ({ ...chamber, calculationTarget: false }))
  );
  assert.equal(excludedValidation.valid, false);

  console.log("V/C calculation state scenarios passed.");
} finally {
  await vite.close();
}
