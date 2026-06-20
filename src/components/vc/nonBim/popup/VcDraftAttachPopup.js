import React from "react";
import { useDispatch, useSelector } from "react-redux";

import vcResultActions from "../../../../store/vc/vcResult/action";
import {
  selectVcResultDraftPopup,
  selectVcResultError,
  selectVcResultLoading,
} from "../../../../store/vc/vcResult/vcSimSelector";

/**
 * Spec Out 결과 저장 시 필요한 표준 기안 정보를 입력받는 보조 팝업입니다.
 * 입력값은 공통 결과 slice에 보관하며 저장 action은 기존 결과 정보와 기안 정보를 함께 saga로 전달합니다.
 */
const VcDraftAttachPopup = () => {
  const dispatch = useDispatch();
  const draftPopup = useSelector(selectVcResultDraftPopup);
  const error = useSelector(selectVcResultError);
  const loading = useSelector(selectVcResultLoading);
  // 제목과 첨부 파일명이 모두 있어야 Spec Out 결과 저장을 요청할 수 있습니다.
  const canSaveWithDraft = Boolean(draftPopup.title.trim() && draftPopup.attachmentName.trim());

  // 팝업 상태가 닫혀 있을 때 DOM을 생성하지 않아 배경 화면의 입력 흐름을 유지합니다.
  if (!draftPopup.visible) return null;

  const handleFieldChange = (name) => (event) => {
    // 제목과 Comment를 공통 결과 slice에 즉시 반영해 저장 payload의 draft 영역으로 사용합니다.
    dispatch(vcResultActions.setDraftField({ name, value: event.target.value }));
  };

  const handleAttachmentChange = (event) => {
    // 현재 미리보기 계약은 파일 본문이 아니라 선택한 파일명을 저장 payload에 포함합니다.
    const fileName = event.target.files?.[0]?.name || "";
    dispatch(vcResultActions.setDraftField({ name: "attachmentName", value: fileName }));
  };

  return (
    <div className="modal-dim nested vcsnofP001Style">
      <div className="modal draft-modal vc-pub-popup">
        <DraftPopupHeader onClose={() => dispatch(vcResultActions.closeDraftPopup())} />

        <div className="popup-body partArea">
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
        </div>

        <div className="footer-actions popup-actions buttonArea">
          {/* saga가 결과 rows와 기안 입력값을 결합해 최종 저장 API를 호출합니다. */}
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

/** 기안 팝업의 제목과 닫기 동작을 제공하는 헤더입니다. */
const DraftPopupHeader = ({ onClose }) => (
  <div className="modal-header">
    <h2>표준 기안 첨부</h2>
    <button type="button" className="link-button popup-close-button" onClick={onClose}>
      Close
    </button>
  </div>
);

export default VcDraftAttachPopup;
