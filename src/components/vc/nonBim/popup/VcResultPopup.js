import React from "react";
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
      className: "notice-box warning",
      message: "Spec Out Chamber가 있습니다. 최종결과저장 시 표준 기안 첨부가 필요합니다.",
    };
  }

  if (hasNaRows) {
    return {
      className: "notice-box info",
      message: "산출대상 제외 또는 Spec 미적용 Chamber가 있습니다. 해당 row는 Conductance와 판정을 N/A로 표시합니다.",
    };
  }

  return {
    className: "notice-box success",
    message: "모든 Spec 판정이 IN입니다. 최종결과저장이 가능합니다.",
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

  if (!visible) return null;

  return (
    <div className="modal-dim">
      <div className="modal result-modal">
        <ResultPopupHeader onClose={() => dispatch(vcResultActions.closeResultPopup())} />

        <section className="result-section">
          <div className="section-title small">기본정보</div>
          <div className="form-grid">
            <ReadonlyField label="FAB" value={basicInfo?.fab} />
            <ReadonlyField label="MODEL" value={basicInfo?.model} />
            <ReadonlyField label="EQ ID" value={basicInfo?.eqId} />
          </div>
        </section>

        <section className="result-section">
          <div className="section-title small">결과정보</div>
          <ResultTable rows={rows} />
        </section>

        <div className={notice.className}>{notice.message}</div>
        {error ? <div className="error-box">{error}</div> : null}

        <div className="footer-actions">
          <button
            type="button"
            className="primary-button"
            disabled={loading.save}
            onClick={() => dispatch(vcResultActions.saveResultRequest())}
          >
            {loading.save ? "Saving..." : "최종결과저장"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => dispatch(vcResultActions.closeResultPopup())}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultPopupHeader = ({ onClose }) => (
  <div className="modal-header">
    <div>
      <div className="breadcrumb">Simulation &gt; V/C Simulation &gt; BIM/5D 미적용Fab &gt; Vacuum Conductance 결과</div>
      <h2>Vacuum Conductance Result</h2>
    </div>
    <button type="button" className="link-button" onClick={onClose}>
      Close
    </button>
  </div>
);

const ResultTable = ({ rows }) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          {RESULT_COLUMNS.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <ResultTableRow key={row.id} row={row} />
        ))}
      </tbody>
    </table>
  </div>
);

const ResultTableRow = ({ row }) => (
  <tr>
    <td>{toDisplayText(row.chamberId)}</td>
    <td>{toDisplayText(row.processLarge)}</td>
    <td>{toDisplayText(row.processMiddle)}</td>
    <td>{toDisplayText(row.modelStandard)}</td>
    <td>{shouldShowSpecColumns(row) ? toDisplayText(row.minSpec) : "-"}</td>
    <td>{shouldShowSpecColumns(row) ? toDisplayText(row.maxSpec) : "-"}</td>
    <td>{toDisplayText(row.conductance)}</td>
    <td>{row.calculationTarget === false || shouldShowSpecColumns(row) ? <JudgeBadge judge={row.judge} /> : "-"}</td>
  </tr>
);

const JudgeBadge = ({ judge }) => {
  const className =
    judge === JUDGE.IN
      ? "judge-badge in"
      : judge === JUDGE.HIGH_OUT || judge === JUDGE.LOW_OUT
        ? "judge-badge out"
        : "judge-badge none";

  return <span className={className}>{JUDGE_LABEL[judge] || toDisplayText(judge)}</span>;
};

const ReadonlyField = ({ label, value }) => (
  <label className="field">
    <span>{label}</span>
    <input value={toDisplayText(value)} readOnly />
  </label>
);

export default VcResultPopup;
