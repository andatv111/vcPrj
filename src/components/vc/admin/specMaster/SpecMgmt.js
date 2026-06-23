import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SpecMgmtMainStyle } from "../../../../styles/vc/pumpingStyle";
import specMasterActions from "../../../../store/vc/vcMgmt/action";
import {
  selectSpecMgmtDetailRows,
  selectSpecMgmtError,
  selectSpecMgmtLoading,
  selectSpecMgmtMasterRows,
  selectSpecMgmtMessage,
  selectSpecMgmtOptions,
  selectSpecMgmtPopup,
  selectSpecMgmtSearch,
  selectSpecMgmtSelectedDetail,
  selectSpecMgmtSelectedDetailSpecId,
  selectSpecMgmtSelectedMaster,
  selectSpecMgmtSelectedSpecId,
} from "../../../../store/vc/vcMgmt/vcSpecMgmtSelector";
import {
  createEmptyFilters,
  DETAIL_PAGE_SIZE,
  downloadSpecMgmtExcel,
  filterRows,
  FILTERABLE_DETAIL_COLUMNS,
  FILTERABLE_MASTER_COLUMNS,
  getTotalPages,
  MASTER_PAGE_SIZE,
  paginateRows,
} from "./core/SpecMgmt.core";
import SpecMgmtPopup from "./pop/SpecMgmtPopup";
import { SelectField } from "./ui/SpecMgmtFields";
import { DetailGridPanel, MasterGridPanel } from "./ui/SpecMgmtGrid";

const SpecMgmt = () => {
  const dispatch = useDispatch();
  const search = useSelector(selectSpecMgmtSearch);
  const options = useSelector(selectSpecMgmtOptions);
  const masterRows = useSelector(selectSpecMgmtMasterRows);
  const detailRows = useSelector(selectSpecMgmtDetailRows);
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
    // 최초 진입 시 콤보 후보 API와 grid 조회 API를 분리 호출한다.
    dispatch(specMasterActions.initRequest());
  }, [dispatch]);

  useEffect(() => {
    setMasterPage(0);
  }, [masterFilters, masterRows]);

  useEffect(() => {
    setDetailPage(0);
  }, [detailFilters, detailRows, selectedSpecId]);

  useEffect(() => {
    if (!filteredMasterRows.length) return;
    if (filteredMasterRows.some((row) => row.specId === selectedSpecId)) return;
    dispatch(specMasterActions.selectMaster(filteredMasterRows[0].specId));
  }, [dispatch, filteredMasterRows, selectedSpecId]);

  const handleDeleteMaster = () => {
    if (!selectedSpecId) return;
    const targetName = selectedMaster?.specNm || selectedSpecId;
    if (window.confirm(`선택한 Master "${targetName}"를 삭제하시겠습니까?\n하위 Detail 데이터도 함께 삭제될 수 있습니다.`)) {
      dispatch(specMasterActions.deleteRequest({ scope: "master", specId: selectedSpecId }));
    }
  };

  const handleDeleteDetail = () => {
    if (!selectedDetail) return;
    const targetName = selectedDetail.specNm || selectedDetail.specId;
    if (window.confirm(`선택한 Detail "${targetName}"를 삭제하시겠습니까?`)) {
      dispatch(specMasterActions.deleteRequest({ scope: "detail", specId: selectedDetail.specId }));
    }
  };

  return (
    <SpecMgmtMainStyle className="page embedded-page vc-pub-screen spec-master-screen">
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
          rows={visibleMasterRows}
          totalCount={masterRows.length}
          filteredCount={filteredMasterRows.length}
          selectedSpecId={selectedSpecId}
          loading={loading}
          page={{ page: masterPage, totalPages: masterTotalPages }}
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
          page={{ page: detailPage, totalPages: detailTotalPages }}
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

      {message ? <div className="notice-box success">{message}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}

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

const SearchPanel = ({ search, options, loading, onChange, onReset, onSearch }) => {
  const modelOptions = search.fabId && options.modelsByFab[search.fabId] ? options.modelsByFab[search.fabId] : options.setModelNms;

  return (
    <section className="panel vc-pub-section searchStyle search_area">
      <div className="section-title">Search Conditions</div>
      <div className="search-row vc-pub-search-row">
        <SelectField label="FAB" value={search.fabId} options={options.fabIds} onChange={(value) => onChange("fabId", value)} />
        <SelectField label="MODEL" value={search.setModelNm} options={modelOptions} onChange={(value) => onChange("setModelNm", value)} />
        <SelectField label="모델관리기준명" value={search.specNm} options={options.specNms} onChange={(value) => onChange("specNm", value)} />
        <button type="button" className="secondary-button signlw-btn" disabled={loading.search} onClick={onReset}>
          초기화
        </button>
        <button type="button" className="primary-button signlw-btn" disabled={loading.search} onClick={onSearch}>
          {loading.search ? "조회 중..." : "조회"}
        </button>
      </div>
    </section>
  );
};

export default SpecMgmt;
