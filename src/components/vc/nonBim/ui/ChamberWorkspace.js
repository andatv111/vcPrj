import React from "react";

import {
  MAX_CHAMBER_COUNT,
  PIPE_COLUMNS,
  PIPE_TYPE,
} from "../core/NonBim.constant";
import { isPipeFieldEditable, toDisplayText } from "../core/NonBim.helper";
import { ReadonlyField } from "./FormFields";

const pipeEditableFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

const PIPE_TYPE_ICON_CLASS = {
  [PIPE_TYPE.PIPE]: "plumbing",
  [PIPE_TYPE.ELBOW]: "elbow",
  [PIPE_TYPE.REDUCER]: "reducer",
};

const getPipeTypeIconClass = (type) => PIPE_TYPE_ICON_CLASS[type] || PIPE_TYPE_ICON_CLASS[PIPE_TYPE.PIPE];

export const ChamberWorkspace = ({
  activeChamber,
  allowSpeclessCalculate = false,
  canAddChamber,
  canRemoveChamber,
  canEditPipe,
  calculationLocked = false,
  chambers,
  loading,
  pipeTypeOptions = [],
  selectedDrawing,
  selectedDrawingStatus,
  addLabel = "Add",
  removeLabel = "Delete",
  title = "Chamber / Pipe Information",
  emptyMessage = "Select a drawing to edit chamber and pipe information.",
  onAddChamber,
  onRemoveChamber,
  onSetActiveChamber,
  onChamberChange,
  onAddPipeRow,
  onRemovePipeRow,
  onSelectPipeRow,
  onPipeRowChange,
  onCalculate,
}) => (
  <section className="panel vc-pub-section vcsnofM001Style">
    <div className="section-header">
      <div className="section-title">{title}</div>
      <div className="button-group buttonArea">
        <button
          type="button"
          className="secondary-button"
          disabled={!canAddChamber}
          title={canAddChamber ? `Up to ${MAX_CHAMBER_COUNT} chambers.` : ""}
          onClick={onAddChamber}
        >
          {addLabel}
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!canRemoveChamber}
          onClick={() => activeChamber && onRemoveChamber(activeChamber.id)}
        >
          {removeLabel}
        </button>
      </div>
    </div>

    {!selectedDrawing ? (
      <div className="empty-box">{emptyMessage}</div>
    ) : (
      <div className="part">
        <ChamberTabs
          chambers={chambers}
          activeChamberId={activeChamber?.id}
          onSetActiveChamber={onSetActiveChamber}
        />
        {activeChamber ? (
          <ChamberEditor
            activeChamber={activeChamber}
            allowSpeclessCalculate={allowSpeclessCalculate}
            canEditPipe={canEditPipe}
            calculationLocked={calculationLocked}
            loading={loading}
            pipeTypeOptions={pipeTypeOptions}
            selectedDrawingStatus={selectedDrawingStatus}
            onChamberChange={onChamberChange}
            onAddPipeRow={onAddPipeRow}
            onRemovePipeRow={onRemovePipeRow}
            onSelectPipeRow={onSelectPipeRow}
            onPipeRowChange={onPipeRowChange}
            onCalculate={onCalculate}
          />
        ) : null}
      </div>
    )}
  </section>
);

export const ChamberTabs = ({ chambers, activeChamberId, onSetActiveChamber }) => (
  <div className="tab-bar">
    {chambers.map((chamber) => (
      <button
        key={chamber.id}
        type="button"
        className={activeChamberId === chamber.id ? "tab active" : "tab"}
        onClick={() => onSetActiveChamber(chamber.id)}
      >
        {chamber.chamberName}
        {chamber.locked ? "" : " *"}
      </button>
    ))}
  </div>
);

export const ChamberEditor = ({
  activeChamber,
  allowSpeclessCalculate,
  canEditPipe,
  calculationLocked,
  loading,
  pipeTypeOptions,
  selectedDrawingStatus,
  onChamberChange,
  onAddPipeRow,
  onRemovePipeRow,
  onSelectPipeRow,
  onPipeRowChange,
  onCalculate,
}) => (
  <div className="partArea">
    <ChamberSpecForm
      activeChamber={activeChamber}
      allowSpeclessCalculate={allowSpeclessCalculate}
      onChamberChange={onChamberChange}
    />

    <div className="section-header compact">
      <div className="section-title small">Pipe Rows</div>
      <div className="button-group buttonArea">
        <button type="button" className="secondary-button" disabled={!canEditPipe} onClick={onAddPipeRow}>
          Add
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!activeChamber.selectedPipeRowId}
          onClick={onRemovePipeRow}
        >
          Delete
        </button>
      </div>
    </div>

    <PipeRowsTable
      activeChamber={activeChamber}
      pipeTypeOptions={pipeTypeOptions}
      onSelectPipeRow={onSelectPipeRow}
      onPipeRowChange={onPipeRowChange}
    />

    <div className="footer-actions">
      {calculationLocked ? (
        <span className="muted">Status: {toDisplayText(selectedDrawingStatus)}</span>
      ) : (
        <button type="button" className="primary-button" disabled={loading.calculate} onClick={onCalculate}>
          {loading.calculate ? "Calculating..." : "Calculate"}
        </button>
      )}
    </div>
  </div>
);

export const ChamberSpecForm = ({ activeChamber, allowSpeclessCalculate, onChamberChange }) => (
  <div className="form-grid">
    <label className="field">
      <span>Model Standard</span>
      <select
        value={activeChamber.modelStandard}
        onChange={(event) => onChamberChange("modelStandard", event.target.value)}
      >
        <option value="">-</option>
        {activeChamber.specOptions.map((option) => (
          <option key={option.value || option.label} value={option.value || option.label}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
    <ReadonlyField label="Min Spec" value={activeChamber.minSpec} />
    <ReadonlyField label="Max Spec" value={activeChamber.maxSpec} />
    <SwitchField
      label="Calculation Target"
      checked={Boolean(activeChamber.calculationTarget)}
      disabled={!allowSpeclessCalculate && !activeChamber.modelStandard}
      onChange={(checked) => onChamberChange("calculationTarget", checked)}
    />
  </div>
);

const SwitchField = ({ label, checked, disabled = false, onChange }) => (
  <label className={`vc-switch-field${disabled ? " disabled" : ""}`}>
    <span className="vc-switch-label">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="vc-switch-track" aria-hidden="true">
      <span className="vc-switch-thumb" />
    </span>
    <span className="vc-switch-value">{checked ? "Y" : "N"}</span>
  </label>
);

export const PipeRowsTable = ({ activeChamber, pipeTypeOptions, onSelectPipeRow, onPipeRowChange }) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          {PIPE_COLUMNS.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {activeChamber.pipeList.map((row) => (
          <PipeRowsTableRow
            key={row.id}
            activeChamber={activeChamber}
            pipeTypeOptions={pipeTypeOptions}
            row={row}
            onSelectPipeRow={onSelectPipeRow}
            onPipeRowChange={onPipeRowChange}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export const PipeRowsTableRow = ({ activeChamber, pipeTypeOptions, row, onSelectPipeRow, onPipeRowChange }) => (
  <tr>
    <td className="center">
      <input
        type="radio"
        name={`pipeRow_${activeChamber.id}`}
        checked={activeChamber.selectedPipeRowId === row.id}
        onChange={() => onSelectPipeRow(row.id)}
      />
    </td>
    <td>
      <div className="pipe-type-cell">
        <span className={`pipe-type-icon ${getPipeTypeIconClass(row.type)}`} aria-hidden="true" />
        <select value={row.type} onChange={(event) => onPipeRowChange(row.id, "type", event.target.value)}>
          {pipeTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </td>
    {pipeEditableFields.map((fieldName) => (
      <td key={fieldName}>
        <input
          value={row[fieldName]}
          disabled={!isPipeFieldEditable(row.type, fieldName)}
          onChange={(event) => onPipeRowChange(row.id, fieldName, event.target.value)}
        />
      </td>
    ))}
  </tr>
);
