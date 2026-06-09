import React from "react";
import { useDispatch, useSelector } from "react-redux";

import vcResultActions from "../../../../store/vc/vcResult/action";
import {
  selectVcResultDraftPopup,
  selectVcResultError,
  selectVcResultLoading,
} from "../../../../store/vc/vcResult/vcSimSelector";

const h = React.createElement;

const VcDraftAttachPopup = () => {
  const dispatch = useDispatch();
  const draftPopup = useSelector(selectVcResultDraftPopup);
  const error = useSelector(selectVcResultError);
  const loading = useSelector(selectVcResultLoading);
  const canSaveWithDraft = Boolean(draftPopup.title.trim() && draftPopup.attachmentName.trim());

  if (!draftPopup.visible) return null;

  const handleAttachmentChange = (event) => {
    const fileName = event.target.files?.[0]?.name || "";
    dispatch(vcResultActions.setDraftField({ name: "attachmentName", value: fileName }));
  };

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
            onChange: (event) => dispatch(vcResultActions.setDraftField({ name: "title", value: event.target.value })),
          })
        ),
        h(
          "div",
          { className: "field" },
          h("span", null, "첨부 파일"),
          h("input", {
            type: "file",
            onChange: handleAttachmentChange,
          }),
          draftPopup.attachmentName ? h("span", { className: "muted" }, draftPopup.attachmentName) : null
        )
      ),
      h(
        "label",
        { className: "field full-field" },
        h("span", null, "Comment"),
        h("textarea", {
          value: draftPopup.comment,
          placeholder: "Spec Out 사유 및 조치 내용을 입력하세요.",
          onChange: (event) => dispatch(vcResultActions.setDraftField({ name: "comment", value: event.target.value })),
        })
      ),
      error ? h("div", { className: "error-box" }, error) : null,
      h(
        "div",
        { className: "footer-actions" },
        h(
          "button",
          {
            type: "button",
            className: "primary-button",
            disabled: !canSaveWithDraft || loading.save,
            onClick: () => dispatch(vcResultActions.saveResultRequest()),
          },
          loading.save ? "Saving..." : "기안 첨부 후 저장"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            onClick: () => dispatch(vcResultActions.closeDraftPopup()),
          },
          "취소"
        )
      )
    )
  );
};

export default VcDraftAttachPopup;
