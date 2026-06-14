import React from "react";
import { useDispatch, useSelector } from "react-redux";

import vcResultActions from "../../../../store/vc/vcResult/action";
import {
  selectVcResultDraftPopup,
  selectVcResultError,
  selectVcResultLoading,
} from "../../../../store/vc/vcResult/vcSimSelector";

const VcDraftAttachPopup = () => {
  const dispatch = useDispatch();
  const draftPopup = useSelector(selectVcResultDraftPopup);
  const error = useSelector(selectVcResultError);
  const loading = useSelector(selectVcResultLoading);
  const canSaveWithDraft = Boolean(draftPopup.title.trim() && draftPopup.attachmentName.trim());

  if (!draftPopup.visible) return null;

  const handleFieldChange = (name) => (event) => {
    dispatch(vcResultActions.setDraftField({ name, value: event.target.value }));
  };

  const handleAttachmentChange = (event) => {
    const fileName = event.target.files?.[0]?.name || "";
    dispatch(vcResultActions.setDraftField({ name: "attachmentName", value: fileName }));
  };

  return (
    <div className="modal-dim nested">
      <div className="modal draft-modal">
        <DraftPopupHeader onClose={() => dispatch(vcResultActions.closeDraftPopup())} />

        <div className="form-grid">
          <label className="field">
            <span>기안 제목</span>
            <input
              value={draftPopup.title}
              placeholder="Spec Out 표준 기안"
              onChange={handleFieldChange("title")}
            />
          </label>

          <div className="field">
            <span>첨부 파일</span>
            <input type="file" onChange={handleAttachmentChange} />
            {draftPopup.attachmentName ? <span className="muted">{draftPopup.attachmentName}</span> : null}
          </div>
        </div>

        <label className="field full-field">
          <span>Comment</span>
          <textarea
            value={draftPopup.comment}
            placeholder="Spec Out 사유 및 조치 내용을 입력하세요."
            onChange={handleFieldChange("comment")}
          />
        </label>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="footer-actions">
          <button
            type="button"
            className="primary-button"
            disabled={!canSaveWithDraft || loading.save}
            onClick={() => dispatch(vcResultActions.saveResultRequest())}
          >
            {loading.save ? "Saving..." : "기안 첨부 후 저장"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => dispatch(vcResultActions.closeDraftPopup())}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

const DraftPopupHeader = ({ onClose }) => (
  <div className="modal-header">
    <h2>표준 기안 첨부</h2>
    <button type="button" className="link-button" onClick={onClose}>
      Close
    </button>
  </div>
);

export default VcDraftAttachPopup;
