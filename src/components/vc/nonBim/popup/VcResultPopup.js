import React from "react";
import { Alert, Badge, Button, Form, Input, Modal, Space, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";

import vcResultActions from "../../../../store/vc/vcResult/action";
import {
  selectVcResultBasicInfo,
  selectVcResultError,
  selectVcResultHasNaRows,
  selectVcResultHasSpecOut,
  selectVcResultLoading,
  selectVcResultRows,
  selectVcResultVisible,
} from "../../../../store/vc/vcResult/vcSimSelector";
import { JUDGE, JUDGE_LABEL, RESULT_COLUMNS } from "../core/NonBim.constant";
import { shouldShowSpecColumns, toDisplayText } from "../core/NonBim.helper";

const getResultNotice = ({ hasSpecOut, hasNaRows }) => {
  if (hasSpecOut) {
    return {
      type: "warning",
      message: "Spec Out Chamber가 있습니다. 최종결과 저장 시 기안 첨부가 필요합니다.",
    };
  }

  if (hasNaRows) {
    return {
      type: "info",
      message: "계산대상 제외 또는 Spec 미적용 Chamber가 있습니다. 해당 row의 Conductance는 N/A로 표시합니다.",
    };
  }

  return {
    type: "success",
    message: "모든 Spec 판정이 IN입니다. 최종결과 저장이 가능합니다.",
  };
};

const VcResultPopup = () => {
  const dispatch = useDispatch();
  const visible = useSelector(selectVcResultVisible);
  const basicInfo = useSelector(selectVcResultBasicInfo);
  const rows = useSelector(selectVcResultRows);
  const loading = useSelector(selectVcResultLoading);
  const error = useSelector(selectVcResultError);
  const hasSpecOut = useSelector(selectVcResultHasSpecOut);
  const hasNaRows = useSelector(selectVcResultHasNaRows);
  const notice = getResultNotice({ hasSpecOut, hasNaRows });

  return (
    <Modal
      className="vcsnofP001Style result-modal vc-pub-popup"
      title="Vacuum Conductance Result"
      open={visible}
      width={1180}
      destroyOnClose
      onCancel={() => dispatch(vcResultActions.closeResultPopup())}
      footer={
        <Space>
          <Button type="primary" loading={loading.save} onClick={() => dispatch(vcResultActions.saveResultRequest())}>
            최종결과 저장
          </Button>
          <Button onClick={() => dispatch(vcResultActions.closeResultPopup())}>취소</Button>
        </Space>
      }
    >
      <div className="popup-body partArea">
        <section className="result-section">
          <div className="section-title small">기본정보</div>
          <Form layout="vertical" className="form-grid">
            <ReadonlyField label="FAB" value={basicInfo?.fabCd} />
            <ReadonlyField label="MODEL" value={basicInfo?.setModelNm} />
            <ReadonlyField label="EQ ID" value={basicInfo?.eqId} />
          </Form>
        </section>

        <section className="result-section">
          <div className="section-title small">결과정보</div>
          <ResultTable rows={rows} />
        </section>

        <Alert type={notice.type} message={notice.message} showIcon />
        {error ? <Alert className="error-box" type="error" message={error} /> : null}
      </div>
    </Modal>
  );
};

const ResultTable = ({ rows }) => {
  const columns = RESULT_COLUMNS.map((column) => ({
    title: column.label,
    dataIndex: column.key,
    key: column.key,
    render: (value, row) => {
      if (column.key === "minSpec" || column.key === "maxSpec") {
        return shouldShowSpecColumns(row) ? toDisplayText(value) : "-";
      }

      if (column.key === "judge") {
        return row.calculationTarget === false || shouldShowSpecColumns(row) ? <JudgeBadge judge={value} /> : "-";
      }

      return toDisplayText(value);
    },
  }));

  return (
    <Table
      className="signlw-table result-table-wrap"
      columns={columns}
      dataSource={rows}
      rowKey={(row) => row.id}
      pagination={false}
      size="small"
      scroll={{ x: "max-content", y: 360 }}
    />
  );
};

const JudgeBadge = ({ judge }) => {
  const color =
    judge === JUDGE.IN
      ? "#087443"
      : judge === JUDGE.HIGH_OUT || judge === JUDGE.LOW_OUT
        ? "#b42318"
        : "#667085";

  return <Badge color={color} text={JUDGE_LABEL[judge] || toDisplayText(judge)} />;
};

const ReadonlyField = ({ label, value }) => (
  <Form.Item className="signlw-form-item" label={label} colon={false}>
    <Input value={toDisplayText(value)} readOnly />
  </Form.Item>
);

export default VcResultPopup;
