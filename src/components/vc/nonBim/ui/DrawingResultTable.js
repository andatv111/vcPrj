import React from "react";
import { Button, Input, Pagination, Table } from "antd";
import { DownloadOutlined, FilterFilled } from "@ant-design/icons";

import { DRAWING_COLUMNS } from "@/components/vc/nonBim/core/NonBim.constant";
import { toDisplayText } from "@/components/vc/nonBim/core/NonBim.helper";
import {
  FILTERABLE_DRAWING_KEYS,
  getDrawingRowNumber,
} from "@/components/vc/nonBim/core/DrawingGrid.core";

export const DrawingResultTable = ({
  drawings,
  loading,
  selectedWoId,
  filters,
  page,
  onFilterChange,
  onPageChange,
  onSelectDrawing,
  onDownload,
}) => {
  const getFilterProps = (column) => {
    if (!FILTERABLE_DRAWING_KEYS.includes(column.key)) return {};

    return {
      filteredValue: filters[column.key] ? [filters[column.key]] : null,
      onFilter: (value, drawing) =>
        String(drawing[column.key] ?? "").toLowerCase().includes(String(value).toLowerCase()),
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

  const columns = [
    {
      title: "",
      dataIndex: "select",
      width: 48,
      align: "center",
      fixed: "left",
      render: (_, row) => (
        <input
          className="vc-grid-radio"
          type="radio"
          name="drawingRadio"
          checked={selectedWoId === row.woId}
          onChange={() => onSelectDrawing(row.woId)}
        />
      ),
    },
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 64,
      align: "center",
      render: (_, row, index) => getDrawingRowNumber(page.page, index, page.pageSize),
    },
    ...DRAWING_COLUMNS.slice(1, 10).map((column) => ({
      title: column.label,
      dataIndex: column.key,
      key: column.key,
      render: (value) => toDisplayText(value),
      ...getFilterProps(column),
    })),
    {
      title: "Foreline 도면",
      children: DRAWING_COLUMNS.slice(10).map((column) => ({
        title: column.label,
        dataIndex: column.key,
        key: column.key,
        align: column.key === "forelineDownload" ? "center" : "left",
        render: (value, row) =>
          column.key === "forelineDownload" ? (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              loading={loading.download}
              onClick={(event) => {
                event.stopPropagation();
                onDownload(row.woId);
              }}
            >
              Download
            </Button>
          ) : (
            toDisplayText(value)
          ),
        ...getFilterProps(column),
      })),
    },
  ];

  return (
    <>
      <Table
      className="signlw-table"
      columns={columns}
      dataSource={drawings}
      rowKey={(row) => row.id}
      pagination={false}
      loading={loading.drawings}
      size="small"
      scroll={{ x: "max-content", y: 180 }}
      rowClassName={(row) => (selectedWoId === row.woId ? "selected-row" : "")}
      onRow={(row) => ({ onClick: () => onSelectDrawing(row.woId) })}
      locale={{ emptyText: "No drawings found. Press Search to load data." }}
    />
    <Pagination
      className="spec-pagination signlw-pagination"
      size="small"
      current={page.page + 1}
      pageSize={1}
      total={page.totalPages || 1}
      showSizeChanger={false}
      onChange={(nextPage) => onPageChange(nextPage - 1)}
    />
    </>
  );
};
