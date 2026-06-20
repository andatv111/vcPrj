import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "../../../vc.css";

import specMasterActions from "../../../store/vc/specMaster/action";
import {
  selectSpecMasterDetailRows,
  selectSpecMasterError,
  selectSpecMasterLoading,
  selectSpecMasterMasterRows,
  selectSpecMasterMessage,
  selectSpecMasterOptions,
  selectSpecMasterPage,
  selectSpecMasterPopup,
  selectSpecMasterSearch,
  selectSpecMasterSelectedDetail,
  selectSpecMasterSelectedDetailSpecId,
  selectSpecMasterSelectedMaster,
  selectSpecMasterSelectedSpecId,
} from "../../../store/vc/specMaster/vcSpecMasterSelector";

const MASTER_COLUMNS = [
  { key: "select", label: "" },
  { key: "no", label: "No" },
  { key: "fabId", label: "FAB" },
  { key: "setModelNm", label: "Model" },
  { key: "specNm", label: "SPEC NAME" },
  { key: "specMinVal", label: "V/C Min" },
  { key: "specMaxVal", label: "V/C Max" },
  { key: "chgrNm", label: "담당자" },
  { key: "detSearYn", label: "상세스펙" },
];

const DETAIL_COLUMNS = [
  { key: "select", label: "" },
  { key: "no", label: "No" },
  { key: "fabId", label: "FAB" },
  { key: "setModelNm", label: "Model" },
  { key: "specNm", label: "SPEC NAME" },
  { key: "operLargeCatgVal", label: "공정대분류" },
  { key: "operMidCatgVal", label: "공정중분류" },
  { key: "chambModelNm", label: "CHAMBER SPEC" },
  { key: "specMinVal", label: "V/C Min" },
  { key: "specMaxVal", label: "V/C Max" },
  { key: "chgrNm", label: "담당자" },
];

const toDisplayText = (value) => (value === undefined || value === null || value === "" ? "-" : String(value));
const getBooleanYn = (value) => (value === "Y" || value === true ? "Y" : "N");

// Excel은 Master와 Detail의 컬럼 구성이 달라서 하나의 CSV row 구조로 섞지 않고,
// Excel이 열 수 있는 HTML table 두 개로 내려받게 한다.
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const createExcelTable = (title, headers, rows) => `
  <h3>${escapeHtml(title)}</h3>
  <table border="1">
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
`;

const downloadExcel = ({ selectedMaster, detailRows }) => {
  const masterRows = selectedMaster
    ? [[
        selectedMaster.fabId,
        selectedMaster.setModelNm,
        selectedMaster.specNm,
        selectedMaster.specMinVal,
        selectedMaster.specMaxVal,
        selectedMaster.chgrNm,
        getBooleanYn(selectedMaster.detSearYn),
      ]]
    : [];
  const detailExcelRows = detailRows.map((row, index) => [
    index + 1,
    row.fabId,
    row.setModelNm,
    row.specNm,
    row.operLargeCatgVal,
    row.operMidCatgVal,
    row.chambModelNm,
    row.specMinVal,
    row.specMaxVal,
    row.chgrNm,
  ]);
  const html = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        ${createExcelTable("MASTER", ["FAB", "Model", "SPEC NAME", "V/C Min", "V/C Max", "담당자", "상세스펙"], masterRows)}
        <br />
        ${createExcelTable("DETAIL", ["No", "FAB", "Model", "SPEC NAME", "공정대분류", "공정중분류", "CHAMBER SPEC", "V/C Min", "V/C Max", "담당자"], detailExcelRows)}
      </body>
    </html>
  `;

  const blob = new Blob([`\uFEFF${html}`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "spec_master.xls";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const SpecMaster = () => {
  const dispatch = useDispatch();
  const search = useSelector(selectSpecMasterSearch);
  const options = useSelector(selectSpecMasterOptions);
  const masterRows = useSelector(selectSpecMasterMasterRows);
  const detailRows = useSelector(selectSpecMasterDetailRows);
  const selectedSpecId = useSelector(selectSpecMasterSelectedSpecId);
  const selectedDetailSpecId = useSelector(selectSpecMasterSelectedDetailSpecId);
  const selectedMaster = useSelector(selectSpecMasterSelectedMaster);
  const selectedDetail = useSelector(selectSpecMasterSelectedDetail);
  const page = useSelector(selectSpecMasterPage);
  const popup = useSelector(selectSpecMasterPopup);
  const loading = useSelector(selectSpecMasterLoading);
  const error = useSelector(selectSpecMasterError);
  const message = useSelector(selectSpecMasterMessage);

  useEffect(() => {
    // 화면 진입 시 콤보 후보와 좌측 Master 목록을 동시에 준비한다.
    // Detail 목록은 search saga가 첫 Master를 받은 뒤 자동으로 조회한다.
    dispatch(specMasterActions.initRequest());
    dispatch(specMasterActions.searchRequest());
  }, [dispatch]);

  return (
    <main className="page embedded-page vc-pub-screen spec-master-screen">
      <SearchPanel
        search={search}
        options={options}
        loading={loading}
        onChange={(name, value) => dispatch(specMasterActions.setSearchField({ name, value }))}
        onReset={() => dispatch(specMasterActions.resetSearch())}
        onSearch={() => dispatch(specMasterActions.searchRequest())}
      />

      <div className="spec-master-grid-layout">
        <MasterGridPanel
          rows={masterRows}
          selectedSpecId={selectedSpecId}
          loading={loading}
          page={page}
          onSelect={(specId) => dispatch(specMasterActions.selectMaster(specId))}
          onCreate={() => dispatch(specMasterActions.openCreatePopup("master"))}
          onEdit={() =>
            selectedMaster && dispatch(specMasterActions.openEditPopup({ scope: "master", row: selectedMaster }))
          }
          onDelete={() =>
            selectedSpecId && dispatch(specMasterActions.deleteRequest({ scope: "master", specId: selectedSpecId }))
          }
          onPageChange={(nextPage) => dispatch(specMasterActions.changePage(nextPage))}
        />

        <DetailGridPanel
          rows={detailRows}
          selectedMaster={selectedMaster}
          selectedDetailSpecId={selectedDetailSpecId}
          loading={loading}
          onSelect={(specId) => dispatch(specMasterActions.selectDetail(specId))}
          onCreate={() => dispatch(specMasterActions.openCreatePopup("detail"))}
          onEdit={() =>
            selectedDetail && dispatch(specMasterActions.openEditPopup({ scope: "detail", row: selectedDetail }))
          }
          onDelete={() =>
            selectedDetail &&
            dispatch(specMasterActions.deleteRequest({ scope: "detail", specId: selectedDetail.specId }))
          }
          onExcel={() => downloadExcel({ selectedMaster, detailRows })}
        />
      </div>

      {message ? <div className="notice-box success">{message}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}

      <SpecMasterPopup
        popup={popup}
        options={options}
        loading={loading}
        selectedMaster={selectedMaster}
        onChange={(name, value) => dispatch(specMasterActions.setPopupField({ name, value }))}
        onClose={() => dispatch(specMasterActions.closePopup())}
        onSave={() => dispatch(specMasterActions.saveRequest())}
      />
    </main>
  );
};

const SearchPanel = ({ search, options, loading, onChange, onReset, onSearch }) => (
  <section className="panel vc-pub-section searchStyle">
    <div className="section-title">Search Conditions</div>
    <div className="search-row vc-pub-search-row">
      <SelectField label="FAB" value={search.fabId} options={options.fabIds} onChange={(value) => onChange("fabId", value)} />
      <SelectField label="MODEL" value={search.setModelNm} options={options.setModelNms} onChange={(value) => onChange("setModelNm", value)} />
      <SelectField label="모델관리기준" value={search.specNm} options={options.specNms} onChange={(value) => onChange("specNm", value)} />
      <button type="button" className="secondary-button" disabled={loading.search} onClick={onReset}>
        초기화
      </button>
      <button type="button" className="primary-button" disabled={loading.search} onClick={onSearch}>
        {loading.search ? "조회 중..." : "조회"}
      </button>
    </div>
  </section>
);

const MasterGridPanel = ({ rows, selectedSpecId, loading, page, onSelect, onCreate, onEdit, onDelete, onPageChange }) => (
  <section className="panel vc-pub-section vcsnofM001Style spec-master-panel">
    <div className="section-header">
      <div className="section-title">Master Grid <span className="muted">전체 {page.totalElements || rows.length}</span></div>
      <div className="button-group buttonArea">
        <button type="button" className="secondary-button" onClick={onCreate}>신규</button>
        <button type="button" className="secondary-button" disabled={!selectedSpecId} onClick={onEdit}>수정</button>
        <button type="button" className="secondary-button" disabled={!selectedSpecId || loading.delete} onClick={onDelete}>삭제</button>
      </div>
    </div>
    <div className="table-wrap tableScrollStyle">
      <table>
        <thead>
          <tr>{MASTER_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.specId || row.id} className={selectedSpecId === row.specId ? "selected-row" : ""}>
              <td className="center">
                <input type="radio" name="specMasterRadio" checked={selectedSpecId === row.specId} onChange={() => onSelect(row.specId)} />
              </td>
              <td className="center">{toDisplayText(row.no)}</td>
              <td>{toDisplayText(row.fabId)}</td>
              <td>{toDisplayText(row.setModelNm)}</td>
              <td>{toDisplayText(row.specNm)}</td>
              <td>{toDisplayText(row.specMinVal)}</td>
              <td>{toDisplayText(row.specMaxVal)}</td>
              <td>{toDisplayText(row.chgrNm || row.chgrEmpno)}</td>
              <td className="center">{getBooleanYn(row.detSearYn)}</td>
            </tr>
          )) : (
            <tr><td className="empty-cell" colSpan={MASTER_COLUMNS.length}>{loading.search ? "조회 중..." : "조회 결과가 없습니다."}</td></tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="spec-pagination">
      <button type="button" className="secondary-button" disabled={page.page <= 0} onClick={() => onPageChange(page.page - 1)}>{"<<"}</button>
      <span>{page.page + 1} / {page.totalPages || 1}</span>
      <button type="button" className="secondary-button" disabled={page.page + 1 >= (page.totalPages || 1)} onClick={() => onPageChange(page.page + 1)}>{">>"}</button>
    </div>
  </section>
);

const DetailGridPanel = ({ rows, selectedMaster, selectedDetailSpecId, loading, onSelect, onCreate, onEdit, onDelete, onExcel }) => (
  <section className="panel vc-pub-section vcsnofM001Style spec-detail-panel">
    <div className="section-header">
      <div className="section-title">Detail Grid <span className="muted">{selectedMaster ? selectedMaster.specNm : "Master를 선택하세요"}</span></div>
      <div className="button-group buttonArea">
        <button type="button" className="secondary-button" disabled={!selectedMaster} onClick={onCreate}>신규</button>
        <button type="button" className="secondary-button" disabled={!rows.length} onClick={onEdit}>수정</button>
        <button type="button" className="secondary-button" disabled={!rows.length || loading.delete} onClick={onDelete}>삭제</button>
        <button type="button" className="secondary-button download-button" disabled={!selectedMaster} onClick={onExcel}>
          <span className="download-icon" aria-hidden="true" />
          Excel
        </button>
      </div>
    </div>
    <div className="table-wrap tableScrollStyle">
      <table>
        <thead>
          <tr>{DETAIL_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row.specId || row.id} className={selectedDetailSpecId === row.specId ? "selected-row" : ""}>
              <td className="center">
                <input type="radio" name="specDetailRadio" checked={selectedDetailSpecId === row.specId} onChange={() => onSelect(row.specId)} />
              </td>
              <td className="center">{index + 1}</td>
              <td>{toDisplayText(row.fabId)}</td>
              <td>{toDisplayText(row.setModelNm)}</td>
              <td>{toDisplayText(row.specNm)}</td>
              <td>{toDisplayText(row.operLargeCatgVal)}</td>
              <td>{toDisplayText(row.operMidCatgVal)}</td>
              <td>{toDisplayText(row.chambModelNm)}</td>
              <td>{toDisplayText(row.specMinVal)}</td>
              <td>{toDisplayText(row.specMaxVal)}</td>
              <td>{toDisplayText(row.chgrNm || row.chgrEmpno)}</td>
            </tr>
          )) : (
            <tr><td className="empty-cell" colSpan={DETAIL_COLUMNS.length}>{loading.details ? "상세 조회 중..." : "상세 데이터가 없습니다."}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const SpecMasterPopup = ({ popup, options, loading, selectedMaster, onChange, onClose, onSave }) => {
  if (!popup.visible) return null;

  const form = popup.form;
  const isDetail = popup.scope === "detail";
  const isMaster = popup.scope === "master";
  const detailSpecEnabled = isDetail || form.detSearYn !== "Y";
  const manualModel = form.manualRegYn === "Y";
  const title = `${isDetail ? "Spec Detail" : "Spec Master"} ${popup.mode === "edit" ? "수정" : "신규"}`;

  return (
    <div className="modal-dim vcsnofP001Style">
      <div className="modal spec-master-modal vc-pub-popup">
        <div className="modal-header">
          <div>
            <div className="breadcrumb">V/C Administration &gt; Spec Master</div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="link-button popup-close-button" onClick={onClose}>Close</button>
        </div>

        <div className="popup-body partArea">
          {isDetail ? <div className="notice-box info">선택한 Master 아래에 상세 Spec을 저장합니다: {toDisplayText(selectedMaster?.specNm)}</div> : null}
          <div className="form-grid spec-master-form-grid">
            <SelectField label="FAB" required value={form.fabId} options={options.fabIds} disabled={isDetail} onChange={(value) => onChange("fabId", value)} />
            <SelectField label="AREA" value={form.area} options={options.areas} disabled={isDetail || manualModel} onChange={(value) => onChange("area", value)} />
            <SelectField label="MAKER" required={isMaster && !manualModel} value={form.maker} options={options.makers} disabled={isDetail || manualModel} onChange={(value) => onChange("maker", value)} />
            {manualModel && isMaster ? (
              <InputField label="MODEL" required value={form.setModelNm} onChange={(value) => onChange("setModelNm", value)} />
            ) : (
              <SelectField label="MODEL" required={isMaster} value={form.setModelNm} options={options.setModelNms} disabled={isDetail} onChange={(value) => onChange("setModelNm", value)} />
            )}
            {isDetail ? (
              // 공정/Chamber 조건은 Detail row의 속성이므로 Master 팝업에는 노출하지 않는다.
              <>
                <SelectField label="공정대분류" required value={form.operLargeCatgVal} options={options.operLargeCatgVals} onChange={(value) => onChange("operLargeCatgVal", value)} />
                <SelectField label="공정중분류" required value={form.operMidCatgVal} options={options.operMidCatgVals} onChange={(value) => onChange("operMidCatgVal", value)} />
                <SelectField label="CHAMBER SPEC" required value={form.chambModelNm} options={options.chambModelNms} onChange={(value) => onChange("chambModelNm", value)} />
              </>
            ) : null}
            <InputField label="모델관리기준명" required={isDetail || detailSpecEnabled} value={form.specNm} disabled={isMaster && !detailSpecEnabled} onChange={(value) => onChange("specNm", value)} />
            <InputField label="MIN SPEC" required={detailSpecEnabled} value={form.specMinVal} disabled={!detailSpecEnabled} onChange={(value) => onChange("specMinVal", value)} />
            <InputField label="MAX SPEC" required={detailSpecEnabled} value={form.specMaxVal} disabled={!detailSpecEnabled} onChange={(value) => onChange("specMaxVal", value)} />
            <InputField label="담당자 사번" value={form.chgrEmpno} onChange={(value) => onChange("chgrEmpno", value)} />
            <InputField label="담당자" required value={form.chgrNm} onChange={(value) => onChange("chgrNm", value)} />
          </div>

          <label className="field full-field">
            <span>비고</span>
            <textarea value={form.specDesc} onChange={(event) => onChange("specDesc", event.target.value)} />
          </label>

          <div className="spec-switch-row">
            {/* 상세스펙 유무와 수기등록은 Master row 작성 규칙이므로 Detail 팝업에서는 숨긴다. */}
            {isMaster ? <SwitchField label="상세스펙 유무" value={form.detSearYn} onChange={(value) => onChange("detSearYn", value)} /> : null}
            {isMaster ? <SwitchField label="수기등록" value={form.manualRegYn} onChange={(value) => onChange("manualRegYn", value)} /> : null}
            <SwitchField label="사용여부" value={form.mgmtTgtYn} onChange={(value) => onChange("mgmtTgtYn", value)} />
          </div>
        </div>

        <div className="footer-actions popup-actions buttonArea">
          <button type="button" className="primary-button" disabled={loading.save} onClick={onSave}>
            {loading.save ? "저장 중..." : "저장"}
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

const SelectField = ({ label, value, options = [], required = false, disabled = false, onChange }) => (
  <label className="field">
    <span>{label}{required ? <em className="required-mark">*</em> : null}</span>
    <select value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="">전체</option>
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value || option.label}>
          {option.label || option.value}
        </option>
      ))}
    </select>
  </label>
);

const InputField = ({ label, value, required = false, disabled = false, onChange }) => (
  <label className="field">
    <span>{label}{required ? <em className="required-mark">*</em> : null}</span>
    <input value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const SwitchField = ({ label, value, onChange }) => (
  <label className="vc-switch-field spec-switch">
    <span className="vc-switch-label">{label}</span>
    <input type="checkbox" checked={value === "Y"} onChange={(event) => onChange(event.target.checked ? "Y" : "N")} />
    <span className="vc-switch-track" aria-hidden="true">
      <span className="vc-switch-thumb" />
    </span>
    <span className="vc-switch-value">{value === "Y" ? "Y" : "N"}</span>
  </label>
);

export default SpecMaster;
