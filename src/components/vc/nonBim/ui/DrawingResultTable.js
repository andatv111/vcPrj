import React from "react";
import { Button, Table } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

import { DRAWING_COLUMNS } from "../core/NonBim.constant";
import { toDisplayText } from "../core/NonBim.helper";

export const DrawingResultTable = ({
  drawings,
  loading,
  selectedWoId,
  onSelectDrawing,
  onDownload,
}) => {
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
    ...DRAWING_COLUMNS.slice(1, 10).map((column) => ({
      title: column.label,
      dataIndex: column.key,
      key: column.key,
      render: (value) => toDisplayText(value),
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
      })),
    },
  ];

  return (
    <Table
      className="signlw-table"
      columns={columns}
      dataSource={drawings}
      rowKey={(row) => row.id}
      pagination={false}
      loading={loading.drawings}
      size="small"
      scroll={{ x: "max-content" }}
      rowClassName={(row) => (selectedWoId === row.woId ? "selected-row" : "")}
      onRow={(row) => ({ onClick: () => onSelectDrawing(row.woId) })}
      locale={{ emptyText: "No drawings found. Press Search to load data." }}
    />
  );
};
