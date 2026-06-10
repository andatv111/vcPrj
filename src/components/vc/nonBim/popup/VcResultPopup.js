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

const h = React.createElement;

const getResultNotice = ({ hasSpecOut, hasNaRows }) => {
  // 안내 문구 우선순위는 Spec Out > N/A row > 정상입니다.
  // Spec Out은 저장 전에 기안 첨부가 필요할 수 있으므로 가장 강한 warning으로 노출합니다.
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

// Non-BIM과 Calculator가 공유하는 Vacuum Conductance Result 팝업입니다.
// 계산 성공 saga가 vcResultActions.openResultPopup을 호출하면 이 컴포넌트가 selector로 표준 결과 모델을 읽습니다.
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

  return h(
    "div",
    { className: "modal-dim" },
    h(
      "div",
      { className: "modal result-modal" },
      h(
        "div",
        { className: "modal-header" },
        h(
          "div",
          null,
          h("div", { className: "breadcrumb" }, "Simulation > V/C Simulation > BIM/5D 미적용 > Vacuum Conductance 결과"),
          h("h2", null, "Vacuum Conductance Result")
        ),
        h(
          "button",
          {
            type: "button",
            className: "link-button",
            onClick: () => dispatch(vcResultActions.closeResultPopup()),
          },
          "Close"
        )
      ),
      h(
        "section",
        { className: "result-section" },
        h("div", { className: "section-title small" }, "기본정보"),
        h(
          "div",
          { className: "form-grid" },
          h(ReadonlyField, { label: "EQ ID", value: basicInfo?.eqId }),
          h(ReadonlyField, { label: "FAB", value: basicInfo?.fab }),
          h(ReadonlyField, { label: "MODEL", value: basicInfo?.model })
        )
      ),
      h(
        "section",
        { className: "result-section" },
        h("div", { className: "section-title small" }, "결과정보"),
        h(ResultTable, { rows })
      ),
      h("div", { className: notice.className }, notice.message),
      error ? h("div", { className: "error-box" }, error) : null,
      h(
        "div",
        { className: "footer-actions" },
        h(
          "button",
          {
            type: "button",
            className: "primary-button",
            disabled: loading.save,
            onClick: () => dispatch(vcResultActions.saveResultRequest()),
          },
          loading.save ? "Saving..." : "최종결과저장"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            onClick: () => dispatch(vcResultActions.closeResultPopup()),
          },
          "취소"
        )
      )
    )
  );
};

const ResultTable = ({ rows }) =>
  // 결과 row는 helper에서 이미 표준 모델로 normalize됩니다.
  // Spec 범위가 없는 row는 판정 의미가 없으므로 Min/Max와 judge 표시를 제한합니다.
  h(
    "div",
    { className: "table-wrap" },
    h(
      "table",
      null,
      h("thead", null, h("tr", null, RESULT_COLUMNS.map((column) => h("th", { key: column.key }, column.label)))),
      h(
        "tbody",
        null,
        rows.map((row) =>
          h(
            "tr",
            { key: row.id },
            h("td", null, toDisplayText(row.chamberId)),
            h("td", null, toDisplayText(row.processLarge)),
            h("td", null, toDisplayText(row.processMiddle)),
            h("td", null, toDisplayText(row.modelStandard)),
            h("td", null, shouldShowSpecColumns(row) ? toDisplayText(row.minSpec) : "-"),
            h("td", null, shouldShowSpecColumns(row) ? toDisplayText(row.maxSpec) : "-"),
            h("td", null, toDisplayText(row.conductance)),
            h("td", null, row.calculationTarget === false || shouldShowSpecColumns(row) ? h(JudgeBadge, { judge: row.judge }) : "-")
          )
        )
      )
    )
  );

const JudgeBadge = ({ judge }) => {
  // badge class는 표준 JUDGE 코드만 기준으로 결정합니다. 신규 판정 코드는 JUDGE/JUDGE_LABEL에 먼저 추가합니다.
  const className =
    judge === JUDGE.IN
      ? "judge-badge in"
      : judge === JUDGE.HIGH_OUT || judge === JUDGE.LOW_OUT
        ? "judge-badge out"
        : "judge-badge none";

  return h("span", { className }, JUDGE_LABEL[judge] || toDisplayText(judge));
};

const ReadonlyField = ({ label, value }) =>
  // 기본정보는 결과 확인용 read-only 필드이며 빈 값은 공통 표시문자 '-'로 보여줍니다.
  h(
    "label",
    { className: "field" },
    h("span", null, label),
    h("input", { value: toDisplayText(value), readOnly: true })
  );

export default VcResultPopup;
