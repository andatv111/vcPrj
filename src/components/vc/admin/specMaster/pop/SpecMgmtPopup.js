import React from "react";

import { SpecMgmtPopupStyle } from "../../../../../styles/vc/pumpingStyle";
import { toDisplayText } from "../core/SpecMgmt.core";
import { InputField, SelectField, SwitchField } from "../ui/SpecMgmtFields";

const getOptionsByKey = (map = {}, key, fallback = []) => (key && map[key] ? map[key] : fallback);

const SpecMgmtPopup = ({ popup, options, loading, onChange, onClose, onSave }) => {
  if (!popup.visible) return null;

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

  return (
    <SpecMgmtPopupStyle className="modal-dim vcsnofP001Style">
      <div className="modal spec-master-modal vc-pub-popup">
        <div className="modal-header">
          <div>
            <div className="breadcrumb">V/C Administration &gt; Spec Master</div>
            <h2>{title}</h2>
          </div>
        </div>

        <div className="popup-body partArea">
          {isDetail ? (
            <div className="notice-box info">
              선택 Master: {toDisplayText(form.upperCd)} / {toDisplayText(form.setModelNm)}
            </div>
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
              <InputField
                label="MODEL"
                required
                value={form.setModelNm}
                onChange={(value) => onChange("setModelNm", value)}
              />
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
                  label="공정대분류"
                  required
                  value={form.operLargeCatgVal}
                  options={options.operLargeCatgVals}
                  onChange={(value) => onChange("operLargeCatgVal", value)}
                />
                <SelectField
                  label="공정중분류"
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
              label="모델관리기준명"
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
            <InputField
              label="장비담당자 사번"
              full
              value={form.chgrEmpno}
              onChange={(value) => onChange("chgrEmpno", value)}
            />
            <InputField
              label="장비담당자"
              required
              full
              value={form.chgrNm}
              onChange={(value) => onChange("chgrNm", value)}
            />
            <InputField label="비고" full value={form.specDesc} onChange={(value) => onChange("specDesc", value)} />
          </div>

          <div className="spec-switch-row">
            {isMaster ? (
              <SwitchField label="상세스펙 유무" value={form.detSearYn} onChange={(value) => onChange("detSearYn", value)} />
            ) : null}
            {isMaster ? (
              <SwitchField label="수기등록" value={form.manualRegYn} onChange={(value) => onChange("manualRegYn", value)} />
            ) : null}
            <SwitchField label="사용여부" value={form.mgmtTgtYn} onChange={(value) => onChange("mgmtTgtYn", value)} />
          </div>
        </div>

        <div className="footer-actions popup-actions buttonArea">
          <button type="button" className="primary-button signlw-btn" disabled={loading.save} onClick={onSave}>
            {loading.save ? "저장 중..." : "저장"}
          </button>
          <button type="button" className="secondary-button signlw-btn" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </SpecMgmtPopupStyle>
  );
};

export default SpecMgmtPopup;
