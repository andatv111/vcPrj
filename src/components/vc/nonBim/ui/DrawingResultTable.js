import React from "react";

import { DRAWING_COLUMNS } from "../core/NonBim.constant";
import { toDisplayText } from "../core/NonBim.helper";

/**
 * 수기 도면 조회 결과를 업무 컬럼과 Foreline 도면 컬럼으로 나누어 표시합니다.
 * 선택값은 WO ID를 기준으로 관리하며 실제 상세 조회와 다운로드는 상위 callback이 수행합니다.
 */
export const DrawingResultTable = ({
  drawings,
  loading,
  selectedWoId,
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
          // row.id는 API/DB PK가 아니라 eqId+woId로 만든 React 렌더링 key입니다.
          drawings.map((row) => (
            <DrawingResultRow
              key={row.id}
              row={row}
              loading={loading}
              selected={selectedWoId === row.woId}
              onSelectDrawing={onSelectDrawing}
              onDownload={onDownload}
            />
          ))
        )}
      </tbody>
    </table>
  </div>
);

/** 수기 도면 한 건의 선택 상태, 업무정보, Foreline 다운로드 동작을 표시합니다. */
export const DrawingResultRow = ({ row, loading, selected, onSelectDrawing, onDownload }) => (
  <tr className={selected ? "selected-row" : ""}>
    <td className="center">
      {/* WO ID를 전달하면 상위 화면에서 Chamber 및 Spec 상세 조회 action을 시작합니다. */}
      <input
        type="radio"
        name="drawingRadio"
        checked={selected}
        onChange={() => onSelectDrawing(row.woId)}
      />
    </td>
    <td>{toDisplayText(row.woId)}</td>
    <td>{toDisplayText(row.eqId)}</td>
    <td>{toDisplayText(row.siteNm)}</td>
    <td>{toDisplayText(row.fabCd)}</td>
    <td>{toDisplayText(row.area)}</td>
    <td>{toDisplayText(row.areaDetail)}</td>
    <td>{toDisplayText(row.chgType1Nm)}</td>
    <td>{toDisplayText(row.catNm)}</td>
    <td>{toDisplayText(row.requestStatus)}</td>
    <td>{toDisplayText(row.fileNm)}</td>
    <td>{toDisplayText(row.crteDt)}</td>
    <td>{toDisplayText(row.crteIdNm)}</td>
    <td className="center">
      {/* 상위 saga가 WO ID에 해당하는 file와 fileSeq를 찾아 파일 API를 호출합니다. */}
      <button
        type="button"
        className="link-button"
        disabled={loading.download}
        onClick={() => onDownload(row.woId)}
      >
        Download
      </button>
    </td>
  </tr>
);
