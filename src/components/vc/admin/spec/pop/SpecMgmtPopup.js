import React, { useState } from "react";
import { Alert, Button, Form, Input, Modal, Space } from "antd";

import { toDisplayText } from "@/components/vc/admin/spec/core/SpecMgmt.core";
import OrganizationChartPopup from "@/components/vc/admin/spec/pop/OrganizationChartPopup";
import { InputField, SelectField, SwitchField } from "@/components/vc/admin/spec/ui/SpecMgmtFields";

const getOptionsByKey = (map = {}, key, fallback = []) => (key && map[key] ? map[key] : fallback);

const SpecMgmtPopup = ({ popup, options, loading, onChange, onClose, onSave }) => {
  const [organizationChartOpen, setOrganizationChartOpen] = useState(false);
  const form = popup.form;
  const isDetail = popup.scope === "detail";
  const isMaster = popup.scope === "master";
  const detailSpecEnabled = isDetail || form.detSearYn !== "Y";
  const manualModel = isMaster && form.manualRegYn === "Y";
  const title = `${isDetail ? "Spec Detail" : "Spec Master"} ${popup.mode === "edit" ? "수정" : "신규"}`;
  const areaOptions = getOptionsByKey(options.areasByFab, form.fabId, options.areas);
  const makerOptions = getOptionsByKey(options.makersByArea, form.area, options.makers);
  const fabModelOptions = getOptionsByKey(options.modelsByFab, form.fabId, options.setModelNms);
  const modelOptions = getOptionsByKey(options.modelsByMaker, form.maker, fabModelOptions);
  const midProcessOptions = getOptionsByKey(options.operMidByLarge, form.operLargeCatgVal, options.operMidCatgVals);
  const selectedManagerEmpNos = form.chgrEmpno ? form.chgrEmpno.split(",").map((value) => value.trim()).filter(Boolean) : [];

  const handleManagerConfirm = (managers) => {
    onChange("chgrEmpno", managers.map((manager) => manager.empNo).join(", "));
    onChange("chgrNm", managers.map((manager) => manager.name).join(", "));
    setOrganizationChartOpen(false);
  };

  const handleClose = () => {
    setOrganizationChartOpen(false);
    onClose();
  };

  return (
    <Modal
      className="vcsnofP001Style spec-master-modal vc-pub-popup"
      title={title}
      open={popup.visible}
      width={900}
      destroyOnClose
      onCancel={handleClose}
      footer={
        <Space>
          <Button
            type="primary"
            loading={loading.save || loading.popupOptions}
            disabled={loading.popupOptions}
            onClick={onSave}
          >
            저장
          </Button>
          <Button onClick={handleClose}>취소</Button>
        </Space>
      }
    >
      <Form layout="vertical" className="popup-body partArea">
        {isDetail ? (
          <Alert
            type="info"
            showIcon
            message={`선택 Master: ${toDisplayText(form.upperCd)} / ${toDisplayText(form.setModelNm)}`}
          />
        ) : null}

        <div className="form-grid spec-master-form-grid formTable">
          <SelectField
            label="FAB"
            required={isMaster}
            value={form.fabId}
            options={options.fabIds}
            disabled={isDetail}
            onChange={(value) => onChange("fabId", value)}
          />
          <SelectField
            label="AREA"
            required={isMaster && !manualModel}
            value={form.area}
            options={areaOptions}
            disabled={isDetail || manualModel || !form.fabId}
            onChange={(value) => onChange("area", value)}
          />
          <SelectField
            label="MAKER"
            required={isMaster && !manualModel}
            value={form.maker}
            options={makerOptions}
            disabled={isDetail || manualModel || !form.area}
            onChange={(value) => onChange("maker", value)}
          />
          {manualModel ? (
            <InputField label="MODEL" required value={form.setModelNm} onChange={(value) => onChange("setModelNm", value)} />
          ) : (
            <SelectField
              label="MODEL"
              required={isMaster}
              value={form.setModelNm}
              options={modelOptions}
              disabled={isDetail || !form.maker}
              onChange={(value) => onChange("setModelNm", value)}
            />
          )}

          {isDetail ? (
            <>
              <SelectField
                label="Process Large"
                required
                value={form.operLargeCatgVal}
                options={options.operLargeCatgVals}
                onChange={(value) => onChange("operLargeCatgVal", value)}
              />
              <SelectField
                label="Process Middle"
                required
                value={form.operMidCatgVal}
                options={midProcessOptions}
                disabled={!form.operLargeCatgVal}
                onChange={(value) => onChange("operMidCatgVal", value)}
              />
              <SelectField
                label="CHAMBER SPEC"
                required
                full
                value={form.chambModelNm}
                options={options.chambModelNms}
                onChange={(value) => onChange("chambModelNm", value)}
              />
            </>
          ) : null}

          <InputField
            label="Spec Name"
            required={detailSpecEnabled}
            full
            value={form.specNm}
            disabled={isMaster && !detailSpecEnabled}
            onChange={(value) => onChange("specNm", value)}
          />
          <InputField
            label="MIN SPEC"
            required={detailSpecEnabled}
            value={form.specMinVal}
            disabled={!detailSpecEnabled}
            onChange={(value) => onChange("specMinVal", value)}
          />
          <InputField
            label="MAX SPEC"
            required={detailSpecEnabled}
            value={form.specMaxVal}
            disabled={!detailSpecEnabled}
            onChange={(value) => onChange("specMaxVal", value)}
          />
          <Form.Item
            className="signlw-form-item full-grid-field"
            label="장비담당자"
            required
            colon={false}
          >
            <Space.Compact block>
              <Input
                readOnly
                value={form.chgrNm || ""}
                placeholder="조직도에서 장비담당자를 선택하세요."
              />
              <Button onClick={() => setOrganizationChartOpen(true)}>조직도</Button>
            </Space.Compact>
          </Form.Item>
          <InputField label="비고" full value={form.specDesc} onChange={(value) => onChange("specDesc", value)} />
        </div>

        <div className="spec-switch-row">
          {isMaster ? <SwitchField label="상세스펙 사용" value={form.detSearYn} onChange={(value) => onChange("detSearYn", value)} /> : null}
          {isMaster ? <SwitchField label="수기등록" value={form.manualRegYn} onChange={(value) => onChange("manualRegYn", value)} /> : null}
          <SwitchField label="사용여부" value={form.mgmtTgtYn} onChange={(value) => onChange("mgmtTgtYn", value)} />
        </div>
      </Form>
      <OrganizationChartPopup
        open={organizationChartOpen}
        selectedEmpNos={selectedManagerEmpNos}
        onCancel={() => setOrganizationChartOpen(false)}
        onConfirm={handleManagerConfirm}
      />
    </Modal>
  );
};

export default SpecMgmtPopup;
