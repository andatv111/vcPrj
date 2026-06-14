import React from "react";

import {
  MAX_CHAMBER_COUNT,
  PIPE_COLUMNS,
} from "../core/NonBim.constant";
import { isPipeFieldEditable, toDisplayText } from "../core/NonBim.helper";
import { ReadonlyField } from "./FormFields";

const pipeEditableFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

export const ChamberWorkspace = ({
  activeChamber,
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
  <section className="panel">
    <div className="section-header">
      <div className="section-title">{title}</div>
      <div className="button-group">
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
      <>
        <ChamberTabs
          chambers={chambers}
          activeChamberId={activeChamber?.id}
          onSetActiveChamber={onSetActiveChamber}
        />
        {activeChamber ? (
          <ChamberEditor
            activeChamber={activeChamber}
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
      </>
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
        {chamber.name}
        {chamber.locked ? "" : " *"}
      </button>
    ))}
  </div>
);

export const ChamberEditor = ({
  activeChamber,
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
  <>
    <ChamberSpecForm activeChamber={activeChamber} onChamberChange={onChamberChange} />

    <div className="section-header compact">
      <div className="section-title small">Pipe Rows</div>
      <div className="button-group">
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
  </>
);

export const ChamberSpecForm = ({ activeChamber, onChamberChange }) => (
  <div className="form-grid">
    <label className="field">
      <span>모델관리기준</span>
      <select
        value={activeChamber.modelStandard}
        onChange={(event) => onChamberChange("modelStandard", event.target.value)}
      >
        {activeChamber.specOptions.length ? (
          activeChamber.specOptions.map((option) => (
            <option key={option.value || option.label} value={option.value || option.label}>
              {option.label}
            </option>
          ))
        ) : (
          <option value="">-</option>
        )}
      </select>
    </label>
    <ReadonlyField label="Min Spec" value={activeChamber.minSpec} />
    <ReadonlyField label="Max Spec" value={activeChamber.maxSpec} />
    <label className="field switch-field">
      <span>산출대상</span>
      <input
        type="checkbox"
        checked={Boolean(activeChamber.calculateEnabled)}
        disabled={!activeChamber.modelStandard}
        onChange={(event) => onChamberChange("calculateEnabled", event.target.checked)}
      />
    </label>
  </div>
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
        {activeChamber.pipeRows.map((row) => (
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
      <select value={row.type} onChange={(event) => onPipeRowChange(row.id, "type", event.target.value)}>
        {pipeTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
