import React from "react";
import { useDispatch, useSelector } from "react-redux";

import vcResultActions from "../../../../store/vc/vcResult/action";
import {
  selectVcResultBasicInfo,
  selectVcResultDraftPopup,
  selectVcResultError,
  selectVcResultHasSpecOut,
  selectVcResultLoading,
  selectVcResultRows,
  selectVcResultSavedInfo,
  selectVcResultVisible,
} from "../../../../store/vc/vcResult/vcSimSelector";
import { JUDGE, JUDGE_LABEL, RESULT_COLUMNS } from "../core/NonBim.constant";
import { shouldShowSpecColumns, toDisplayText } from "../core/NonBim.helper";

const h = React.createElement;

const VcResultPopup = () => {
  // 계산 결과 팝업은 Non-BIM과 Calculator가 함께 사용합니다.
  // sourceType과 rows는 vcResult reducer에 저장되어 저장/기안첨부 분기에도 같은 데이터를 씁니다.
  const dispatch = useDispatch();
  const visible = useSelector(selectVcResultVisible);
  const basicInfo = useSelector(selectVcResultBasicInfo);
  const rows = useSelector(selectVcResultRows);
  const loading = useSelector(selectVcResultLoading);
  const error = useSelector(selectVcResultError);
  const savedInfo = useSelector(selectVcResultSavedInfo);
  const draftPopup = useSelector(selectVcResultDraftPopup);
  const hasSpecOut = useSelector(selectVcResultHasSpecOut);

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
          h("div", { className: "breadcrumb" }, "Simulation > V/C Simulation > BIM/5D미적용 > Vacuum Conductance 결과"),
          h("h2", null, "Vacuum Conductance Result")
        ),
        h(
          "button",
          {
            type: "button",
            className: "link-button",
            // action: CLOSE_RESULT_POPUP
            // 사용처: reducer가 공용 결과 팝업 visible만 false로 바꿉니다.
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
      hasSpecOut
        ? h("div", { className: "notice-box warning" }, "Spec Out Chamber가 있습니다. 최종결과저장 시 표준 기안 첨부가 필요합니다.")
        : h("div", { className: "notice-box success" }, "모든 Spec 판정이 IN입니다. 최종 결과 저장이 가능합니다."),
      error ? h("div", { className: "error-box" }, error) : null,
      savedInfo ? h("div", { className: "notice-box success" }, `저장 완료: ${savedInfo.savedId}`) : null,
      h(
        "div",
        { className: "footer-actions" },
        h(
          "button",
          {
            type: "button",
            className: "primary-button",
            disabled: loading.save,
            // action: SAVE_RESULT_REQUEST
            // 사용처: reducer가 Spec Out 기안 첨부 필요 여부를 먼저 판단하고, saga가 저장 API를 호출합니다.
            onClick: () => dispatch(vcResultActions.saveResultRequest()),
          },
          loading.save ? "Saving..." : "최종결과저장"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            // action: CLOSE_RESULT_POPUP
            // 사용처: 저장하지 않고 결과 팝업만 닫습니다.
            onClick: () => dispatch(vcResultActions.closeResultPopup()),
          },
          "취소"
        )
      ),
      draftPopup.visible ? h(DraftAttachPopup, { draftPopup }) : null
    )
  );
};

const ResultTable = ({ rows }) =>
  // Spec Min/Max가 없는 row는 판정 대상이 아니므로 spec 컬럼과 judge를 "-"로 보여줍니다.
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
            h("td", null, shouldShowSpecColumns(row) ? h(JudgeBadge, { judge: row.judge }) : "-")
          )
        )
      )
    )
  );

const JudgeBadge = ({ judge }) => {
  // 판정 결과는 색상 badge로 빠르게 구분합니다. 표준 judge 코드는 helper에서 normalize됩니다.
  const className =
    judge === JUDGE.IN
      ? "judge-badge in"
      : judge === JUDGE.HIGH_OUT || judge === JUDGE.LOW_OUT
        ? "judge-badge out"
        : "judge-badge none";

  return h("span", { className }, JUDGE_LABEL[judge] || toDisplayText(judge));
};

const ReadonlyField = ({ label, value }) =>
  h(
    "label",
    { className: "field" },
    h("span", null, label),
    h("input", { value: toDisplayText(value), readOnly: true })
  );

const DraftAttachPopup = ({ draftPopup }) => {
  const dispatch = useDispatch();

  // Non-BIM 결과 중 Spec Out이 있으면 최종 저장 전에 기안 첨부 정보를 요구하는 중첩 팝업입니다.
  return h(
    "div",
    { className: "modal-dim nested" },
    h(
      "div",
      { className: "modal draft-modal" },
      h(
        "div",
        { className: "modal-header" },
        h("h2", null, "표준 기안 첨부"),
        h(
          "button",
          {
            type: "button",
            className: "link-button",
            // action: CLOSE_DRAFT_POPUP
            // 사용처: 중첩 기안 첨부 팝업만 닫고 결과 팝업은 유지합니다.
            onClick: () => dispatch(vcResultActions.closeDraftPopup()),
          },
          "Close"
        )
      ),
      h(
        "div",
        { className: "form-grid" },
        h(
          "label",
          { className: "field" },
          h("span", null, "기안 제목"),
          h("input", {
            value: draftPopup.title,
            placeholder: "Spec Out 표준 기안",
            // action: SET_DRAFT_FIELD
            // 사용처: reducer가 draftPopup.title을 갱신합니다.
            onChange: (event) => dispatch(vcResultActions.setDraftField({ name: "title", value: event.target.value })),
          })
        ),
        h(
          "label",
          { className: "field" },
          h("span", null, "첨부 파일명"),
          h("input", {
            value: draftPopup.attachmentName,
            placeholder: "standard_draft.pdf",
            // action: SET_DRAFT_FIELD
            // 사용처: reducer가 draftPopup.attachmentName을 갱신합니다.
            onChange: (event) =>
              dispatch(vcResultActions.setDraftField({ name: "attachmentName", value: event.target.value })),
          })
        )
      ),
      h(
        "label",
        { className: "field full-field" },
        h("span", null, "Comment"),
        h("textarea", {
          value: draftPopup.comment,
          placeholder: "Spec Out 사유 및 조치 내용을 입력하세요.",
          // action: SET_DRAFT_FIELD
          // 사용처: reducer가 draftPopup.comment를 갱신합니다.
          onChange: (event) => dispatch(vcResultActions.setDraftField({ name: "comment", value: event.target.value })),
        })
      ),
      h(
        "div",
        { className: "footer-actions" },
        h(
          "button",
          {
            type: "button",
            className: "primary-button",
            // action: SAVE_RESULT_REQUEST
            // 사용처: 기안 정보 입력 후 다시 저장 요청을 보내 saga 저장 API 흐름으로 진입합니다.
            onClick: () => dispatch(vcResultActions.saveResultRequest()),
          },
          "기안 첨부 후 저장"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            // action: CLOSE_DRAFT_POPUP
            // 사용처: 기안 첨부 입력을 취소하고 중첩 팝업만 닫습니다.
            onClick: () => dispatch(vcResultActions.closeDraftPopup()),
          },
          "취소"
        )
      )
    )
  );
};

export default VcResultPopup;
