import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "../../../styles.css";

import vcCalculatorActions from "../../../store/vc/vcCalculator/action";
import {
  selectVcCalculatorActiveChamber,
  selectVcCalculatorChambers,
  selectVcCalculatorEquipment,
  selectVcCalculatorError,
  selectVcCalculatorLoading,
  selectVcCalculatorOptions,
} from "../../../store/vc/vcCalculator/vcSimSelector";
import { MAX_CHAMBER_COUNT } from "./core/NonBim.constant";
import VcDraftAttachPopup from "./popup/VcDraftAttachPopup";
import VcResultPopup from "./popup/VcResultPopup";
import { ChamberWorkspace } from "./ui/ChamberWorkspace";
import { SelectField } from "./ui/FormFields";

const VcCalculator = () => {
  const dispatch = useDispatch();
  const equipment = useSelector(selectVcCalculatorEquipment);
  const options = useSelector(selectVcCalculatorOptions);
  const chambers = useSelector(selectVcCalculatorChambers);
  const activeChamber = useSelector(selectVcCalculatorActiveChamber);
  const loading = useSelector(selectVcCalculatorLoading);
  const error = useSelector(selectVcCalculatorError);

  useEffect(() => {
    // Calculator options are B/E-owned so FAB/MODEL/Spec lists stay aligned with Java DTOs.
    dispatch(vcCalculatorActions.initRequest());
  }, [dispatch]);

  const handleChamberChange = (name, value) => {
    if (!activeChamber) return;
    // Calculator keeps Model Standard state per chamber tab. One tab must not overwrite another tab.
    dispatch(vcCalculatorActions.updateChamberField({ chamberId: activeChamber.id, name, value }));
  };

  const handlePipeRowChange = (rowId, name, value) => {
    if (!activeChamber) return;
    // Pipe type rules and numeric cleanup live in the reducer/helper so the UI remains simple.
    dispatch(vcCalculatorActions.updatePipeRow({ chamberId: activeChamber.id, rowId, name, value }));
  };

  return (
    <main className="page embedded-page">
      <CalculatorSearchPanel
        equipment={equipment}
        options={options}
        onFieldChange={(name, value) => dispatch(vcCalculatorActions.setEquipmentField({ name, value }))}
      />

      <ChamberWorkspace
        activeChamber={activeChamber}
        allowSpeclessCalculate
        canAddChamber={chambers.length < MAX_CHAMBER_COUNT}
        canRemoveChamber={Boolean(activeChamber && chambers.length > 1)}
        canEditPipe={Boolean(activeChamber)}
        chambers={chambers}
        loading={loading}
        pipeTypeOptions={options.pipeTypes}
        selectedDrawing={{ sourceType: "CALCULATOR" }}
        addLabel="Add"
        removeLabel="Delete"
        title="Chamber / Pipe Information"
        emptyMessage="Add chamber information to calculate V/C."
        onAddChamber={() => dispatch(vcCalculatorActions.addChamber())}
        onRemoveChamber={(chamberId) => dispatch(vcCalculatorActions.removeChamber(chamberId))}
        onSetActiveChamber={(chamberId) => dispatch(vcCalculatorActions.setActiveChamber(chamberId))}
        onChamberChange={handleChamberChange}
        onAddPipeRow={() => activeChamber && dispatch(vcCalculatorActions.addPipeRow(activeChamber.id))}
        onRemovePipeRow={() => activeChamber && dispatch(vcCalculatorActions.removeSelectedPipeRow(activeChamber.id))}
        onSelectPipeRow={(rowId) =>
          activeChamber && dispatch(vcCalculatorActions.selectPipeRow({ chamberId: activeChamber.id, rowId }))
        }
        onPipeRowChange={handlePipeRowChange}
        onCalculate={() => dispatch(vcCalculatorActions.calculateRequest())}
      />

      {error ? <div className="error-box">{error}</div> : null}
      <VcResultPopup />
      <VcDraftAttachPopup />
    </main>
  );
};

const CalculatorSearchPanel = ({ equipment, options, onFieldChange }) => (
  <section className="panel">
    <div className="section-title">Search Conditions</div>
    <div className="search-row">
      <SelectField
        label="FAB"
        placeholder="All"
        value={equipment.fab}
        options={options.fabs}
        onChange={(value) => onFieldChange("fab", value)}
      />
      <SelectField
        label="MODEL"
        placeholder="All"
        value={equipment.model}
        options={options.models}
        onChange={(value) => onFieldChange("model", value)}
      />
    </div>
  </section>
);

export default VcCalculator;
