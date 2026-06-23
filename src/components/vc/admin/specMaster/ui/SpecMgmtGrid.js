import React, { useState } from "react";

import { DETAIL_COLUMNS, getBooleanYn, MASTER_COLUMNS, toDisplayText } from "../core/SpecMgmt.core";

const GridHeaderFilter = ({ column, value, onChange }) => {
  const [open, setOpen] = useState(false);
  if (column.key === "select" || column.key === "no") return null;
  const active = Boolean(value);

  return (
    <span className="grid-header-filter">
      <button
        type="button"
        className={active ? "grid-filter-button active" : "grid-filter-button"}
        aria-label={`${column.label} 필터`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="grid-filter-icon" aria-hidden="true" />
      </button>
      {open ? (
        <span className="grid-filter-popover">
          <input
            className="grid-filter-input"
            value={value || ""}
            placeholder={`${column.label} 필터`}
            autoFocus
            onChange={(event) => onChange(column.key, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          />
          <button type="button" className="grid-filter-clear" onClick={() => onChange(column.key, "")}>
            Clear
          </button>
        </span>
      ) : null}
    </span>
  );
};

const GridPager = ({ page, onPageChange }) => (
  <div className="spec-pagination signlw-pagination">
    <button type="button" className="secondary-button btn_small" disabled={page.page <= 0} onClick={() => onPageChange(page.page - 1)}>
      {"<<"}
    </button>
    <span>{page.page + 1} / {page.totalPages || 1}</span>
    <button
      type="button"
      className="secondary-button btn_small"
      disabled={page.page + 1 >= (page.totalPages || 1)}
      onClick={() => onPageChange(page.page + 1)}
    >
      {">>"}
    </button>
  </div>
);

export const MasterGridPanel = ({
  rows,
  totalCount,
  filteredCount,
  selectedSpecId,
  loading,
  page,
  filters,
  onFilterChange,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onPageChange,
}) => (
  <section className="panel vc-pub-section vcsnofM001Style spec-master-panel">
    <div className="section-header search">
      <div className="section-title">Master Grid <span className="muted">전체 {totalCount} / 필터 {filteredCount}</span></div>
      <div className="button-group buttonArea">
        <button type="button" className="secondary-button btn_small" onClick={onCreate}>신규</button>
        <button type="button" className="secondary-button btn_small" disabled={!selectedSpecId} onClick={onEdit}>수정</button>
        <button type="button" className="secondary-button btn_small" disabled={!selectedSpecId || loading.delete} onClick={onDelete}>삭제</button>
      </div>
    </div>
    <div className="table-wrap tableScrollStyle vcsspecM001_table">
      <table className="signlw-table">
        <thead>
          <tr>{MASTER_COLUMNS.map((column) => (
            <th key={column.key}>
              <span className="grid-header-label">{column.label}</span>
              <GridHeaderFilter column={column} value={filters[column.key]} onChange={onFilterChange} />
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.specId || row.id} className={selectedSpecId === row.specId ? "selected-row" : ""}>
              <td className="center">
                <input type="radio" name="specMasterRadio" checked={selectedSpecId === row.specId} onChange={() => onSelect(row.specId)} />
              </td>
              <td className="center">{toDisplayText(row.no)}</td>
              <td>{toDisplayText(row.fabId)}</td>
              <td>{toDisplayText(row.setModelNm)}</td>
              <td>{toDisplayText(row.specNm)}</td>
              <td>{toDisplayText(row.specMinVal)}</td>
              <td>{toDisplayText(row.specMaxVal)}</td>
              <td>{toDisplayText(row.chgrNm || row.chgrEmpno)}</td>
              <td className="center">{getBooleanYn(row.detSearYn)}</td>
            </tr>
          )) : (
            <tr><td className="empty-cell" colSpan={MASTER_COLUMNS.length}>{loading.search ? "조회 중..." : "조회 결과가 없습니다."}</td></tr>
          )}
        </tbody>
      </table>
    </div>
    <GridPager page={page} onPageChange={onPageChange} />
  </section>
);

export const DetailGridPanel = ({
  rows,
  totalCount,
  filteredCount,
  selectedMaster,
  selectedDetailSpecId,
  loading,
  page,
  filters,
  onFilterChange,
  onPageChange,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onExcel,
}) => (
  <section className="panel vc-pub-section vcsnofM001Style spec-detail-panel">
    <div className="section-header search">
      <div className="section-title">
        Detail Grid <span className="muted">{selectedMaster ? `${selectedMaster.specNm} | 전체 ${totalCount} / 필터 ${filteredCount}` : "Master를 선택하세요"}</span>
      </div>
      <div className="button-group buttonArea">
        <button type="button" className="secondary-button btn_small" disabled={!selectedMaster} onClick={onCreate}>신규</button>
        <button type="button" className="secondary-button btn_small" disabled={!rows.length} onClick={onEdit}>수정</button>
        <button type="button" className="secondary-button btn_small" disabled={!rows.length || loading.delete} onClick={onDelete}>삭제</button>
        <button type="button" className="secondary-button download-button btn_small" disabled={!selectedMaster} onClick={onExcel}>
          <span className="download-icon" aria-hidden="true" />
          Excel
        </button>
      </div>
    </div>
    <div className="table-wrap tableScrollStyle vcsspecM001_table">
      <table className="signlw-table">
        <thead>
          <tr>{DETAIL_COLUMNS.map((column) => (
            <th key={column.key}>
              <span className="grid-header-label">{column.label}</span>
              <GridHeaderFilter column={column} value={filters[column.key]} onChange={onFilterChange} />
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row.specId || row.id} className={selectedDetailSpecId === row.specId ? "selected-row" : ""}>
              <td className="center">
                <input type="radio" name="specDetailRadio" checked={selectedDetailSpecId === row.specId} onChange={() => onSelect(row.specId)} />
              </td>
              <td className="center">{index + 1}</td>
              <td>{toDisplayText(row.fabId)}</td>
              <td>{toDisplayText(row.setModelNm)}</td>
              <td>{toDisplayText(row.specNm)}</td>
              <td>{toDisplayText(row.operLargeCatgVal)}</td>
              <td>{toDisplayText(row.operMidCatgVal)}</td>
              <td>{toDisplayText(row.chambModelNm)}</td>
              <td>{toDisplayText(row.specMinVal)}</td>
              <td>{toDisplayText(row.specMaxVal)}</td>
              <td>{toDisplayText(row.chgrNm || row.chgrEmpno)}</td>
            </tr>
          )) : (
            <tr><td className="empty-cell" colSpan={DETAIL_COLUMNS.length}>{loading.details ? "상세 조회 중..." : "상세 데이터가 없습니다."}</td></tr>
          )}
        </tbody>
      </table>
    </div>
    <GridPager page={page} onPageChange={onPageChange} />
  </section>
);
