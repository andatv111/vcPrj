import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Modal, Space } from "antd";

import { SpecMgmtMainStyle } from "@/styles/vc/pumpingStyle";
import specMasterActions from "@/store/vc/spec/action";
import {
  selectSpecMgmtSelectedDetailRows,
  selectSpecMgmtError,
  selectSpecMgmtLoading,
  selectSpecMgmtMasterRows,
  selectSpecMgmtMessage,
  selectSpecMgmtOptions,
  selectSpecMgmtPopup,
  selectSpecMgmtSearch,
  selectSpecMgmtSpecNameSuggestions,
  selectSpecMgmtSelectedDetail,
  selectSpecMgmtSelectedDetailSpecId,
  selectSpecMgmtSelectedMaster,
  selectSpecMgmtSelectedSpecId,
} from "@/store/vc/specSelector";
import {
  createEmptyFilters,
  DETAIL_PAGE_SIZE,
  downloadSpecMgmtExcel,
  filterRows,
  FILTERABLE_DETAIL_COLUMNS,
  FILTERABLE_MASTER_COLUMNS,
  getPageForRow,
  getTotalPages,
  MASTER_PAGE_SIZE,
  paginateRows,
} from "@/components/vc/admin/spec/core/SpecMgmt.core";
import SpecMgmtPopup from "@/components/vc/admin/spec/pop/SpecMgmtPopup";
import SuggestInput from "@/components/vc/common/SuggestInput";
import { SelectField } from "@/components/vc/admin/spec/ui/SpecMgmtFields";
import { DetailGridPanel, MasterGridPanel } from "@/components/vc/admin/spec/ui/SpecMgmtGrid";

const SpecMgmt = () => {
  const dispatch = useDispatch();
  const search = useSelector(selectSpecMgmtSearch);
  const options = useSelector(selectSpecMgmtOptions);
  const specNameSuggestions = useSelector(selectSpecMgmtSpecNameSuggestions);
  const masterRows = useSelector(selectSpecMgmtMasterRows);
  const detailRows = useSelector(selectSpecMgmtSelectedDetailRows);
  const selectedSpecId = useSelector(selectSpecMgmtSelectedSpecId);
  const selectedDetailSpecId = useSelector(selectSpecMgmtSelectedDetailSpecId);
  const selectedMaster = useSelector(selectSpecMgmtSelectedMaster);
  const selectedDetail = useSelector(selectSpecMgmtSelectedDetail);
  const popup = useSelector(selectSpecMgmtPopup);
  const loading = useSelector(selectSpecMgmtLoading);
  const error = useSelector(selectSpecMgmtError);
  const message = useSelector(selectSpecMgmtMessage);
  const [masterFilters, setMasterFilters] = useState(() => createEmptyFilters(FILTERABLE_MASTER_COLUMNS));
  const [detailFilters, setDetailFilters] = useState(() => createEmptyFilters(FILTERABLE_DETAIL_COLUMNS));
  const [masterPage, setMasterPage] = useState(0);
  const [detailPage, setDetailPage] = useState(0);

  const filteredMasterRows = useMemo(
    () => filterRows(masterRows, masterFilters, FILTERABLE_MASTER_COLUMNS),
    [masterRows, masterFilters]
  );
  const filteredDetailRows = useMemo(
    () => filterRows(detailRows, detailFilters, FILTERABLE_DETAIL_COLUMNS),
    [detailRows, detailFilters]
  );
  const masterTotalPages = getTotalPages(filteredMasterRows.length, MASTER_PAGE_SIZE);
  const detailTotalPages = getTotalPages(filteredDetailRows.length, DETAIL_PAGE_SIZE);
  const visibleMasterRows = useMemo(
    () => paginateRows(filteredMasterRows, Math.min(masterPage, masterTotalPages - 1), MASTER_PAGE_SIZE),
    [filteredMasterRows, masterPage, masterTotalPages]
  );
  const visibleDetailRows = useMemo(
    () => paginateRows(filteredDetailRows, Math.min(detailPage, detailTotalPages - 1), DETAIL_PAGE_SIZE),
    [filteredDetailRows, detailPage, detailTotalPages]
  );

  useEffect(() => {
    dispatch(specMasterActions.initRequest());
  }, [dispatch]);

  useEffect(() => {
    dispatch(specMasterActions.fetchSpecNameSuggestionsRequest(search.specNm));
  }, [dispatch, search.specNm]);

  useEffect(() => {
    setMasterPage(0);
  }, [masterFilters]);

  useEffect(() => {
    setDetailPage(0);
  }, [detailFilters, selectedSpecId]);

  // 저장/삭제 후 재조회해도 선택 row가 있는 F/E 페이지로 돌아간다.
  useEffect(() => {
    const selectedPage = getPageForRow(filteredMasterRows, selectedSpecId, MASTER_PAGE_SIZE);
    if (selectedPage >= 0) setMasterPage(selectedPage);
  }, [filteredMasterRows, selectedSpecId]);

  useEffect(() => {
    const selectedPage = getPageForRow(filteredDetailRows, selectedDetailSpecId, DETAIL_PAGE_SIZE);
    if (selectedPage >= 0) setDetailPage(selectedPage);
  }, [filteredDetailRows, selectedDetailSpecId]);

  useEffect(() => {
    if (!filteredMasterRows.length) return;
    if (filteredMasterRows.some((row) => row.specId === selectedSpecId)) return;
    dispatch(specMasterActions.selectMaster(filteredMasterRows[0].specId));
  }, [dispatch, filteredMasterRows, selectedSpecId]);

  useEffect(() => {
    if (!filteredDetailRows.length) return;
    if (filteredDetailRows.some((row) => row.specId === selectedDetailSpecId)) return;
    dispatch(specMasterActions.selectDetail(filteredDetailRows[0].specId));
  }, [dispatch, filteredDetailRows, selectedDetailSpecId]);

  useEffect(() => {
    setMasterPage((page) => Math.min(page, masterTotalPages - 1));
  }, [masterTotalPages]);

  useEffect(() => {
    setDetailPage((page) => Math.min(page, detailTotalPages - 1));
  }, [detailTotalPages]);

  useEffect(() => {
    if (message !== "Spec Master 저장이 완료되었습니다.") return;
    setMasterFilters(createEmptyFilters(FILTERABLE_MASTER_COLUMNS));
    setDetailFilters(createEmptyFilters(FILTERABLE_DETAIL_COLUMNS));
  }, [message]);

  const handleDeleteMaster = () => {
    if (!selectedSpecId) return;
    const targetName = selectedMaster?.specNm || selectedSpecId;
    Modal.confirm({
      title: "Delete Master",
      content: `Delete master "${targetName}" and its detail rows?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => dispatch(specMasterActions.deleteRequest({ scope: "master", specId: selectedSpecId })),
    });
  };

  const handleDeleteDetail = () => {
    if (!selectedDetail) return;
    const targetName = selectedDetail.specNm || selectedDetail.specId;
    Modal.confirm({
      title: "Delete Detail",
      content: `Delete detail "${targetName}"?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => dispatch(specMasterActions.deleteRequest({ scope: "detail", specId: selectedDetail.specId })),
    });
  };

  return (
    <SpecMgmtMainStyle className="page embedded-page vc-pub-screen spec-master-screen">
      <SearchPanel
        search={search}
        options={options}
        specNameSuggestions={specNameSuggestions}
        loading={loading}
        onChange={(name, value) => dispatch(specMasterActions.setSearchField({ name, value }))}
        onReset={() => dispatch(specMasterActions.resetSearch())}
        onSearch={() => dispatch(specMasterActions.searchRequest())}
      />

      <div className="spec-master-grid-layout">
        <MasterGridPanel
          rows={visibleMasterRows}
          totalCount={masterRows.length}
          filteredCount={filteredMasterRows.length}
          selectedSpecId={selectedSpecId}
          loading={loading}
          page={{ page: masterPage, pageSize: MASTER_PAGE_SIZE, totalPages: masterTotalPages }}
          filters={masterFilters}
          onFilterChange={(key, value) => setMasterFilters((prev) => ({ ...prev, [key]: value }))}
          onSelect={(specId) => dispatch(specMasterActions.selectMaster(specId))}
          onCreate={() => dispatch(specMasterActions.openCreatePopup("master"))}
          onEdit={() =>
            selectedMaster && dispatch(specMasterActions.openEditPopup({ scope: "master", row: selectedMaster }))
          }
          onDelete={handleDeleteMaster}
          onPageChange={setMasterPage}
        />

        <DetailGridPanel
          rows={visibleDetailRows}
          totalCount={detailRows.length}
          filteredCount={filteredDetailRows.length}
          selectedMaster={selectedMaster}
          selectedDetailSpecId={selectedDetailSpecId}
          loading={loading}
          page={{ page: detailPage, pageSize: DETAIL_PAGE_SIZE, totalPages: detailTotalPages }}
          filters={detailFilters}
          onFilterChange={(key, value) => setDetailFilters((prev) => ({ ...prev, [key]: value }))}
          onPageChange={setDetailPage}
          onSelect={(specId) => dispatch(specMasterActions.selectDetail(specId))}
          onCreate={() => dispatch(specMasterActions.openCreatePopup("detail"))}
          onEdit={() =>
            selectedDetail && dispatch(specMasterActions.openEditPopup({ scope: "detail", row: selectedDetail }))
          }
          onDelete={handleDeleteDetail}
          onExcel={() => downloadSpecMgmtExcel({ selectedMaster, detailRows: filteredDetailRows })}
        />
      </div>

      {message ? <Alert className="notice-box success" type="success" message={message} /> : null}
      {error ? <Alert className="error-box" type="error" message={error} /> : null}

      <SpecMgmtPopup
        popup={popup}
        options={options}
        loading={loading}
        onChange={(name, value) => dispatch(specMasterActions.setPopupField({ name, value }))}
        onClose={() => dispatch(specMasterActions.closePopup())}
        onSave={() => dispatch(specMasterActions.saveRequest())}
      />
    </SpecMgmtMainStyle>
  );
};

const SearchPanel = ({ search, options, specNameSuggestions, loading, onChange, onReset, onSearch }) => {
  const modelOptions =
    search.fabId && options.modelsByFab[search.fabId] ? options.modelsByFab[search.fabId] : options.setModelNms;
  const specNameItems = specNameSuggestions.length ? specNameSuggestions : options.specNms;

  return (
    <section className="panel vc-pub-section searchStyle search_area">
      <div className="section-title">Search Conditions</div>
      <div className="search-row vc-pub-search-row vc-search-actions-row">
        <SelectField label="FAB" value={search.fabId} options={options.fabIds} onChange={(value) => onChange("fabId", value)} />
        <SelectField label="MODEL" value={search.setModelNm} options={modelOptions} onChange={(value) => onChange("setModelNm", value)} />
        <SuggestInput
          label="Spec Name"
          value={search.specNm}
          placeholder="Spec Name"
          items={specNameItems}
          onChange={(value) => onChange("specNm", value)}
        />
        <Space className="vc-search-actions">
          <Button disabled={loading.search} onClick={onReset}>
            Reset
          </Button>
          <Button type="primary" loading={loading.search} onClick={onSearch}>
            Search
          </Button>
        </Space>
      </div>
    </section>
  );
};

export default SpecMgmt;
