import React from "react";
import { useDispatch, useSelector } from "react-redux";

import vcResultActions from "../../../../store/vc/vcResult/action";
import {
  selectVcResultDraftPopup,
  selectVcResultError,
  selectVcResultLoading,
} from "../../../../store/vc/vcResult/vcSimSelector";

const h = React.createElement;

// Spec Out이 포함된 Non-BIM 결과를 저장할 때 필요한 표준 기안 첨부 팝업입니다.
// 이 팝업은 결과 팝업 위에 뜨는 중첩 팝업이며, 저장 완료 처리는 동일한 SAVE_RESULT_REQUEST 흐름을 다시 사용합니다.
const VcDraftAttachPopup = () => {
  const dispatch = useDispatch();
  const draftPopup = useSelector(selectVcResultDraftPopup);
  const error = useSelector(selectVcResultError);
  const loading = useSelector(selectVcResultLoading);
  const canSaveWithDraft = Boolean(draftPopup.title.trim() && draftPopup.attachmentName.trim());

  if (!draftPopup.visible) return null;

  const handleAttachmentChange = (event) => {
    // preview 단계에서는 실제 파일 업로드 대신 파일명을 저장 payload의 첨부 식별값으로 사용합니다.
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
