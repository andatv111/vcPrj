import React from "react";
import { Alert, Button, Form, Input, Modal, Space, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
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

  const handleFieldChange = (name) => (event) => {
    dispatch(vcResultActions.setDraftField({ name, value: event.target.value }));
  };

  const handleAttachmentChange = ({ file }) => {
    dispatch(vcResultActions.setDraftField({ name: "attachmentName", value: file?.name || "" }));
    return false;
  };

  return (
    <Modal
      className="vcsnofP001Style draft-modal vc-pub-popup"
      title="기안 첨부"
      open={draftPopup.visible}
      width={640}
      destroyOnClose
      onCancel={() => dispatch(vcResultActions.closeDraftPopup())}
      footer={
        <Space>
          <Button
            type="primary"
            disabled={!canSaveWithDraft}
            loading={loading.save}
            onClick={() => dispatch(vcResultActions.saveResultRequest())}
          >
            기안 첨부 후 저장
          </Button>
          <Button onClick={() => dispatch(vcResultActions.closeDraftPopup())}>취소</Button>
        </Space>
      }
    >
      <Form layout="vertical" className="popup-body partArea">
        <div className="form-grid">
          <Form.Item className="signlw-form-item" label="기안 제목" colon={false}>
            <Input
              value={draftPopup.title}
              placeholder="Spec Out 기안"
              onChange={handleFieldChange("title")}
            />
          </Form.Item>

          <Form.Item className="signlw-form-item" label="첨부 파일" colon={false}>
            <Upload beforeUpload={() => false} maxCount={1} onChange={handleAttachmentChange}>
              <Button icon={<UploadOutlined />}>파일 선택</Button>
            </Upload>
            {draftPopup.attachmentName ? <span className="muted">{draftPopup.attachmentName}</span> : null}
          </Form.Item>
        </div>

        <Form.Item className="signlw-form-item full-field" label="Comment" colon={false}>
          <Input.TextArea
            value={draftPopup.comment}
            placeholder="Spec Out 사유 및 조치 내용을 입력하세요."
            onChange={handleFieldChange("comment")}
          />
        </Form.Item>

        {error ? <Alert className="error-box" type="error" message={error} /> : null}
      </Form>
    </Modal>
  );
};

export default VcDraftAttachPopup;
