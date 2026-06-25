import React from "react";
import { Button, Form, Input, Select, Space, Switch, Table, Tabs, Tooltip } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

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

const toSelectOptions = (options = []) =>
  options.map((option) => ({
    label: option.label || option.value,
    value: option.value || option.label,
  }));

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
      <Space className="buttonArea">
        <Tooltip title={canAddChamber ? `Up to ${MAX_CHAMBER_COUNT} chambers.` : ""}>
          <Button icon={<PlusOutlined />} disabled={!canAddChamber} onClick={onAddChamber}>
            {addLabel}
          </Button>
        </Tooltip>
        <Button
          icon={<DeleteOutlined />}
          disabled={!canRemoveChamber}
          onClick={() => activeChamber && onRemoveChamber(activeChamber.id)}
        >
          {removeLabel}
        </Button>
      </Space>
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
  <Tabs
    className="vcsnofM001_tab"
    activeKey={activeChamberId}
    onChange={onSetActiveChamber}
    items={chambers.map((chamber) => ({
      key: chamber.id,
      label: `${chamber.chamberName}${chamber.locked ? "" : " *"}`,
    }))}
  />
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
      <Space className="buttonArea">
        <Button icon={<PlusOutlined />} disabled={!canEditPipe} onClick={onAddPipeRow}>
          Add
        </Button>
        <Button icon={<DeleteOutlined />} disabled={!activeChamber.selectedPipeRowId} onClick={onRemovePipeRow}>
          Delete
        </Button>
      </Space>
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
        <Button type="primary" loading={loading.calculate} onClick={onCalculate}>
          Calculate
        </Button>
      )}
    </div>
  </div>
);

export const ChamberSpecForm = ({ activeChamber, allowSpeclessCalculate, onChamberChange }) => (
  <Form layout="vertical" className="form-grid">
    <Form.Item className="signlw-form-item" label="Model Standard" colon={false}>
      <Select
        allowClear
        showSearch
        value={activeChamber.modelStandard || undefined}
        placeholder="-"
        options={toSelectOptions(activeChamber.specOptions)}
        optionFilterProp="label"
        onChange={(value) => onChamberChange("modelStandard", value || "")}
      />
    </Form.Item>
    <ReadonlyField label="Min Spec" value={activeChamber.minSpec} />
    <ReadonlyField label="Max Spec" value={activeChamber.maxSpec} />
    <Form.Item className="signlw-form-item" label="Calculation Target" colon={false}>
      <Switch
        checked={Boolean(activeChamber.calculationTarget)}
        disabled={!allowSpeclessCalculate && !activeChamber.modelStandard}
        checkedChildren="Y"
        unCheckedChildren="N"
        onChange={(checked) => onChamberChange("calculationTarget", checked)}
      />
    </Form.Item>
  </Form>
);

export const PipeRowsTable = ({ activeChamber, pipeTypeOptions, onSelectPipeRow, onPipeRowChange }) => {
  const columns = PIPE_COLUMNS.map((column) => {
    if (column.key === "select") {
      return {
        title: "",
        dataIndex: "select",
        width: 48,
        align: "center",
        render: (_, row) => (
          <input
            className="vc-grid-radio"
            type="radio"
            name={`pipeRow_${activeChamber.id}`}
            checked={activeChamber.selectedPipeRowId === row.id}
            onChange={() => onSelectPipeRow(row.id)}
          />
        ),
      };
    }

    if (column.key === "type") {
      return {
        title: column.label,
        dataIndex: "type",
        width: 210,
        render: (value, row) => (
          <Space className="pipe-type-cell">
            <span className={`pipe-type-icon ${getPipeTypeIconClass(value)}`} aria-hidden="true" />
            <Select
              value={value}
              options={toSelectOptions(pipeTypeOptions)}
              onChange={(nextValue) => onPipeRowChange(row.id, "type", nextValue)}
            />
          </Space>
        ),
      };
    }

    return {
      title: column.label,
      dataIndex: column.key,
      render: (value, row) => (
        <Input
          value={value}
          disabled={!isPipeFieldEditable(row.type, column.key)}
          onChange={(event) => onPipeRowChange(row.id, column.key, event.target.value)}
        />
      ),
    };
  });

  return (
    <Table
      className="signlw-table"
      columns={columns}
      dataSource={activeChamber.pipeList}
      rowKey={(row) => row.id}
      pagination={false}
      size="small"
      scroll={{ x: "max-content" }}
      rowClassName={(row) => (activeChamber.selectedPipeRowId === row.id ? "selected-row" : "")}
      onRow={(row) => ({ onClick: () => onSelectPipeRow(row.id) })}
    />
  );
};
