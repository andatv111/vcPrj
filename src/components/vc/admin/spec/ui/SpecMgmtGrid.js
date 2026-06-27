import React from "react";
import { Button, Input, Pagination, Space, Table } from "antd";
import { DownloadOutlined, FilterFilled } from "@ant-design/icons";

import {
  DETAIL_COLUMNS,
  getBooleanYn,
  getPagedRowNumber,
  MASTER_COLUMNS,
  toDisplayText,
} from "@/components/vc/admin/spec/core/SpecMgmt.core";

const getColumnText = (row, key, index, page = 0, pageSize = 0) => {
  if (key === "no") return getPagedRowNumber(page, pageSize, index);
  if (key === "chgrNm") return row.chgrNm || row.chgrEmpno;
  if (key === "detSearYn") return getBooleanYn(row.detSearYn);
  return row[key];
};

const withFilter = (column, filters, onFilterChange) => {
  if (column.key === "select" || column.key === "no") return {};

  return {
    filteredValue: filters[column.key] ? [filters[column.key]] : null,
    onFilter: (value, record) => toDisplayText(getColumnText(record, column.key)).includes(String(value)),
    filterIcon: () => <FilterFilled />,
    filterDropdown: ({ confirm }) => (
      <div className="filter-pop" onKeyDown={(event) => event.stopPropagation()}>
        <Input
          allowClear
          size="small"
          value={filters[column.key] || ""}
          placeholder={`${column.label} filter`}
          onChange={(event) => {
            onFilterChange(column.key, event.target.value);
            confirm({ closeDropdown: false });
          }}
        />
      </div>
    ),
  };
};

const GridPager = ({ page, onPageChange }) => (
  <Pagination
    className="spec-pagination signlw-pagination"
    size="small"
    current={page.page + 1}
    pageSize={1}
    total={page.totalPages || 1}
    showSizeChanger={false}
    onChange={(nextPage) => onPageChange(nextPage - 1)}
  />
);

const createSelectionColumn = ({ selectedId, onSelect, radioName }) => ({
  title: "",
  dataIndex: "select",
  minWidth: 48,
  width: 48,
  align: "center",
  render: (_, row) => (
    <input
      className="vc-grid-radio"
      type="radio"
      name={radioName}
      checked={selectedId === row.specId}
      onChange={() => onSelect(row.specId)}
    />
  ),
});

const buildMasterColumns = ({ filters, selectedSpecId, onFilterChange, onSelect, page }) =>
  MASTER_COLUMNS.map((column) => {
    if (column.key === "select") {
      return createSelectionColumn({ selectedId: selectedSpecId, onSelect, radioName: "specMasterRadio" });
    }

    return {
      title: column.label,
      dataIndex: column.key,
      key: column.key,
      minWidth: column.key === "specNm" ? 160 : 92,
      width: column.key === "specNm" ? 180 : 110,
      align: column.key === "no" || column.key === "detSearYn" ? "center" : "left",
      render: (value, row, index) =>
        toDisplayText(getColumnText(row, column.key, index, page.page, page.pageSize)),
      ...withFilter(column, filters, onFilterChange),
    };
  });

const buildDetailColumns = ({ filters, selectedDetailSpecId, onFilterChange, onSelect, page }) =>
  DETAIL_COLUMNS.map((column) => {
    if (column.key === "select") {
      return createSelectionColumn({ selectedId: selectedDetailSpecId, onSelect, radioName: "specDetailRadio" });
    }

    return {
      title: column.label,
      dataIndex: column.key,
      key: column.key,
      minWidth: column.key === "specNm" || column.key === "chambModelNm" ? 160 : 92,
      width: column.key === "specNm" || column.key === "chambModelNm" ? 180 : 112,
      align: column.key === "no" ? "center" : "left",
      render: (value, row, index) =>
        toDisplayText(getColumnText(row, column.key, index, page.page, page.pageSize)),
      ...withFilter(column, filters, onFilterChange),
    };
  });

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
      <div className="section-title">
        Master Grid <span className="muted">Total {totalCount} / Filtered {filteredCount}</span>
      </div>
      <Space className="buttonArea">
        <Button size="small" onClick={onCreate}>New</Button>
        <Button size="small" disabled={!selectedSpecId} onClick={onEdit}>Edit</Button>
        <Button size="small" danger disabled={!selectedSpecId || loading.delete} onClick={onDelete}>Delete</Button>
      </Space>
    </div>
    <Table
      className="signlw-table"
      columns={buildMasterColumns({
        filters,
        selectedSpecId,
        onFilterChange,
        onSelect,
        page,
      })}
      dataSource={rows}
      rowKey={(row) => row.specId || row.id}
      pagination={false}
      loading={loading.search}
      size="small"
      scroll={{ x: "max-content", y: 400 }}
      rowClassName={(row) => (selectedSpecId === row.specId ? "selected-row" : "")}
      onRow={(row) => ({ onClick: () => onSelect(row.specId) })}
      locale={{ emptyText: loading.search ? "Searching..." : "No data." }}
    />
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
        Detail Grid{" "}
        <span className="muted">
          {selectedMaster ? `${selectedMaster.specNm} | Total ${totalCount} / Filtered ${filteredCount}` : "Select Master"}
        </span>
      </div>
      <Space className="buttonArea">
        <Button size="small" disabled={!selectedMaster} onClick={onCreate}>New</Button>
        <Button size="small" disabled={!rows.length} onClick={onEdit}>Edit</Button>
        <Button size="small" danger disabled={!rows.length || loading.delete} onClick={onDelete}>Delete</Button>
        <Button size="small" icon={<DownloadOutlined />} disabled={!selectedMaster} onClick={onExcel}>Excel</Button>
      </Space>
    </div>
    <Table
      className="signlw-table"
      columns={buildDetailColumns({
        filters,
        selectedDetailSpecId,
        onFilterChange,
        onSelect,
        page,
      })}
      dataSource={rows}
      rowKey={(row) => row.specId || row.id}
      pagination={false}
      loading={loading.details}
      size="small"
      scroll={{ x: "max-content", y: 400 }}
      rowClassName={(row) => (selectedDetailSpecId === row.specId ? "selected-row" : "")}
      onRow={(row) => ({ onClick: () => onSelect(row.specId) })}
      locale={{ emptyText: loading.details ? "Loading details..." : "No detail data." }}
    />
    <GridPager page={page} onPageChange={onPageChange} />
  </section>
);
