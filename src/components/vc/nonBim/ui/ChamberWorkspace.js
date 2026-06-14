import React from "react";

import {
  MAX_CHAMBER_COUNT,
  PIPE_COLUMNS,
} from "../core/NonBim.constant";
import { isPipeFieldEditable, toDisplayText } from "../core/NonBim.helper";
import { ReadonlyField } from "./FormFields";

// 배관 유형에 따라 실제 활성화 여부는 isPipeFieldEditable 정책으로 결정됩니다.
const pipeEditableFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

/**
 * Non-BIM과 Calculator가 공유하는 Chamber 및 배관 편집 영역입니다.
 * 이 컴포넌트는 표시와 사용자 이벤트 전달만 담당하며 상태 변경 규칙은 각 화면의 reducer가 처리합니다.
 */
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

/** Chamber 목록을 탭으로 표시하고 선택된 Chamber ID를 상위 화면에 전달합니다. */
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

/** 활성 Chamber의 Spec, 배관 행, 계산 실행 영역을 한 화면에 구성합니다. */
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
      {/* 잠금 상태에서는 계산을 실행하지 않고 현재 도면 요청상태를 안내합니다. */}
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

/** Model Standard 선택값과 연계된 Spec 및 산출대상 여부를 편집합니다. */
export const ChamberSpecForm = ({ activeChamber, onChamberChange }) => (
  <div className="form-grid">
    <label className="field">
      <span>모델관리기준</span>
      <select
        value={activeChamber.modelStandard}
        onChange={(event) => onChamberChange("modelStandard", event.target.value)}
      >
        {/* 옵션이 없으면 빈 선택지만 표시하고 산출대상 checkbox도 비활성화됩니다. */}
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
        checked={Boolean(activeChamber.calculationTarget)}
        disabled={!activeChamber.modelStandard}
        onChange={(event) => onChamberChange("calculationTarget", event.target.checked)}
      />
    </label>
  </div>
);

/** 활성 Chamber의 계산 요청 DTO에 포함될 배관 목록을 표 형태로 표시합니다. */
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

/**
 * 배관 한 행을 편집합니다.
 * radio는 삭제 대상을 지정하고 각 input의 활성화 여부는 배관 유형별 정책을 따릅니다.
 */
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
