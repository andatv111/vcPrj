import React from "react";

import { DRAWING_COLUMNS } from "../core/NonBim.constant";
import { toDisplayText } from "../core/NonBim.helper";

export const DrawingResultTable = ({
  drawings,
  loading,
  selectedConstructionNo,
  onSelectDrawing,
  onDownload,
}) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          {DRAWING_COLUMNS.slice(0, 10).map((column) => (
            <th key={column.key} rowSpan={2}>
              {column.label}
            </th>
          ))}
          <th colSpan={4}>Foreline 도면</th>
        </tr>
        <tr>
          {DRAWING_COLUMNS.slice(10).map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {drawings.length === 0 ? (
          <tr>
            <td colSpan={DRAWING_COLUMNS.length} className="empty-cell">
              No drawings found. Press Search to load data.
            </td>
          </tr>
        ) : (
          drawings.map((row) => (
            <DrawingResultRow
              key={row.id}
              row={row}
              loading={loading}
              selected={selectedConstructionNo === row.constructionNo}
              onSelectDrawing={onSelectDrawing}
              onDownload={onDownload}
            />
          ))
        )}
      </tbody>
    </table>
  </div>
);

export const DrawingResultRow = ({ row, loading, selected, onSelectDrawing, onDownload }) => (
  <tr className={selected ? "selected-row" : ""}>
    <td className="center">
      <input
        type="radio"
        name="drawingRadio"
        checked={selected}
        onChange={() => onSelectDrawing(row.constructionNo)}
      />
    </td>
    <td>{toDisplayText(row.constructionNo)}</td>
    <td>{toDisplayText(row.eqId)}</td>
    <td>{toDisplayText(row.site)}</td>
    <td>{toDisplayText(row.fab)}</td>
    <td>{toDisplayText(row.area1)}</td>
    <td>{toDisplayText(row.area2)}</td>
    <td>{toDisplayText(row.changeType)}</td>
    <td>{toDisplayText(row.equipmentType)}</td>
    <td>{toDisplayText(row.requestStatus)}</td>
    <td>{toDisplayText(row.foreline?.categoryName)}</td>
    <td>{toDisplayText(row.foreline?.registeredAt)}</td>
    <td>{toDisplayText(row.foreline?.registeredBy)}</td>
    <td className="center">
      <button
        type="button"
        className="link-button"
        disabled={loading.download}
        onClick={() => onDownload(row.constructionNo)}
      >
        Download
      </button>
    </td>
  </tr>
);
