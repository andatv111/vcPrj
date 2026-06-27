import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Form, Input, Space } from "antd";

import { Bim5dMainStyle } from "@/styles/vc/pumpingStyle";
import nonBimActions from "@/store/vc/nonBim/action";
import {
  selectActiveChamber,
  selectChambers,
  selectDrawings,
  selectEqSuggestions,
  selectError,
  selectLoading,
  selectNonBimOptions,
  selectSearch,
  selectSelectedWoId,
  selectSelectedDrawing,
} from "@/store/vc/nonBim/vcSimSelector";
import { MAX_CHAMBER_COUNT } from "@/components/vc/nonBim/core/NonBim.constant";
import { isCalculationLockedByDrawingStatus } from "@/components/vc/nonBim/core/NonBim.helper";
import {
  createDrawingFilters,
  DRAWING_PAGE_SIZE,
  filterDrawings,
  getDrawingPage,
  getDrawingTotalPages,
  paginateDrawings,
} from "@/components/vc/nonBim/core/DrawingGrid.core";
import VcDraftAttachPopup from "@/components/vc/nonBim/popup/VcDraftAttachPopup";
import VcResultPopup from "@/components/vc/nonBim/popup/VcResultPopup";
import SuggestInput from "@/components/vc/common/SuggestInput";
import { ChamberWorkspace } from "@/components/vc/nonBim/ui/ChamberWorkspace";
import { DrawingResultTable } from "@/components/vc/nonBim/ui/DrawingResultTable";

const Bim5DNotApplied = () => {
  const dispatch = useDispatch();
  const search = useSelector(selectSearch);
  const options = useSelector(selectNonBimOptions);
  const eqSuggestions = useSelector(selectEqSuggestions);
  const drawings = useSelector(selectDrawings);
  const selectedWoId = useSelector(selectSelectedWoId);
  const selectedDrawing = useSelector(selectSelectedDrawing);
  const chambers = useSelector(selectChambers);
  const activeChamber = useSelector(selectActiveChamber);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const user = useSelector((state) => state.userInfo?.user);
  const sessionPrjtCd = user?.prjtCd || "M16";
  const [searchValidationMessage, setSearchValidationMessage] = useState("");
  const [drawingFilters, setDrawingFilters] = useState(createDrawingFilters);
  const [drawingPage, setDrawingPage] = useState(0);

  const filteredDrawings = useMemo(
    () => filterDrawings(drawings, drawingFilters),
    [drawings, drawingFilters]
  );
  const drawingTotalPages = getDrawingTotalPages(filteredDrawings.length);
  const visibleDrawings = useMemo(
    () => paginateDrawings(filteredDrawings, Math.min(drawingPage, drawingTotalPages - 1)),
    [filteredDrawings, drawingPage, drawingTotalPages]
  );

  const canEditPipe = Boolean(selectedDrawing && activeChamber);
  const calculationLocked = isCalculationLockedByDrawingStatus(selectedDrawing?.requestStatus);

  useEffect(() => {
    dispatch(nonBimActions.initOptionsRequest());
  }, [dispatch]);

  useEffect(() => {
    dispatch(nonBimActions.fetchEqSuggestionsRequest(search.eqId));
  }, [dispatch, search.eqId]);

  useEffect(() => {
    if (search.fabCd !== sessionPrjtCd) {
      dispatch(nonBimActions.setSearchField({ name: "fabCd", value: sessionPrjtCd }));
    }
  }, [dispatch, search.fabCd, sessionPrjtCd]);

  useEffect(() => {
    setDrawingPage(0);
  }, [drawings, drawingFilters]);

  useEffect(() => {
    if (!filteredDrawings.length) return;
    if (filteredDrawings.some((drawing) => drawing.woId === selectedWoId)) return;
    dispatch(nonBimActions.selectDrawing(filteredDrawings[0].woId));
  }, [dispatch, filteredDrawings, selectedWoId]);

  useEffect(() => {
    const selectedPage = getDrawingPage(filteredDrawings, selectedWoId);
    if (selectedPage >= 0) setDrawingPage(selectedPage);
  }, [filteredDrawings, selectedWoId]);

  useEffect(() => {
    setDrawingPage((page) => Math.min(page, drawingTotalPages - 1));
  }, [drawingTotalPages]);

  const handleSearchChange = (name) => (event) => {
    if (name === "eqId" && event.target.value.trim()) {
      setSearchValidationMessage("");
    }
    dispatch(nonBimActions.setSearchField({ name, value: event.target.value }));
  };

  const handleSearch = () => {
    if (!search.eqId.trim()) {
      setSearchValidationMessage("EQ ID는 필수 입력조건입니다.");
      return;
    }

    setSearchValidationMessage("");
    dispatch(nonBimActions.fetchManualDrawingsRequest());
  };

  const handleChamberChange = (name, value) => {
    if (!activeChamber) return;
    dispatch(nonBimActions.updateChamberField({ chamberId: activeChamber.id, name, value }));
  };

  const handlePipeRowChange = (rowId, name, value) => {
    if (!activeChamber) return;
    dispatch(nonBimActions.updatePipeRow({ chamberId: activeChamber.id, rowId, name, value }));
  };

  return (
    <Bim5dMainStyle className="page embedded-page vc-pub-screen vcsnof-m001">
      <NonBimSearchPanel
        search={search}
        eqSuggestions={eqSuggestions}
        error={error}
        validationMessage={searchValidationMessage}
        loading={loading}
        onSearchChange={handleSearchChange}
        onSelectEqSuggestion={(value) => {
          setSearchValidationMessage("");
          dispatch(nonBimActions.setSearchField({ name: "eqId", value }));
        }}
        onResetSearch={() => dispatch(nonBimActions.resetSearch())}
        onSearch={handleSearch}
      />

      <DrawingResultsPanel
        drawings={visibleDrawings}
        totalCount={drawings.length}
        filteredCount={filteredDrawings.length}
        loading={loading}
        selectedWoId={selectedWoId}
        filters={drawingFilters}
        page={{ page: drawingPage, pageSize: DRAWING_PAGE_SIZE, totalPages: drawingTotalPages }}
        onFilterChange={(key, value) =>
          setDrawingFilters((previous) => ({ ...previous, [key]: value }))
        }
        onPageChange={setDrawingPage}
        onSelectDrawing={(woId) => dispatch(nonBimActions.selectDrawing(woId))}
        onDownload={(woId) => dispatch(nonBimActions.downloadForelineRequest(woId))}
      />

      <ChamberWorkspace
        addChamberAsTab
        activeChamber={activeChamber}
        canAddChamber={Boolean(selectedDrawing) && !loading.chambers && chambers.length < MAX_CHAMBER_COUNT}
        canRemoveChamber={Boolean(activeChamber && !activeChamber.locked)}
        canEditPipe={canEditPipe}
        calculationLocked={calculationLocked}
        chambers={chambers}
        loading={loading}
        pipeTypeOptions={options.pipeTypes}
        selectedDrawing={selectedDrawing}
        selectedDrawingStatus={selectedDrawing?.requestStatus}
        addLabel="Add Chamber"
        removeLabel="Remove"
        title="Chamber / Pipe Information"
        onAddChamber={() => dispatch(nonBimActions.addChamber())}
        onRemoveChamber={(chamberId) => dispatch(nonBimActions.removeChamber(chamberId))}
        onSetActiveChamber={(chamberId) => dispatch(nonBimActions.setActiveChamber(chamberId))}
        onChamberChange={handleChamberChange}
        onAddPipeRow={() => activeChamber && dispatch(nonBimActions.addPipeRow(activeChamber.id))}
        onRemovePipeRow={() => activeChamber && dispatch(nonBimActions.removeSelectedPipeRow(activeChamber.id))}
        onSelectPipeRow={(rowId) =>
          activeChamber && dispatch(nonBimActions.selectPipeRow({ chamberId: activeChamber.id, rowId }))
        }
        onPipeRowChange={handlePipeRowChange}
        onCalculate={() => dispatch(nonBimActions.calculateRequest())}
      />

      <VcResultPopup />
      <VcDraftAttachPopup />
    </Bim5dMainStyle>
  );
};

const NonBimSearchPanel = ({
  search,
  eqSuggestions,
  error,
  validationMessage,
  loading,
  onSearchChange,
  onSelectEqSuggestion,
  onResetSearch,
  onSearch,
}) => (
  <section className="panel vc-pub-section searchStyle">
    <div className="section-title">Search Conditions</div>
    <Form layout="vertical" className="search-row vc-pub-search-row vc-search-actions-row">
      <Form.Item className="signlw-form-item" label="FAB" colon={false}>
        <Input value={search.fabCd} readOnly />
      </Form.Item>

      <SuggestInput
        label="EQ ID"
        value={search.eqId}
        placeholder="Equipment ID"
        items={eqSuggestions.slice(0, 10)}
        onChange={(value) => onSearchChange("eqId")({ target: { value } })}
        onSelect={onSelectEqSuggestion}
      />

      <Form.Item className="signlw-form-item" label="WO ID" colon={false}>
        <Input placeholder="WO ID" value={search.woId} onChange={onSearchChange("woId")} />
      </Form.Item>

      <Space className="vc-search-actions">
        <Button
          disabled={loading.drawings || (!search.fabCd && !search.eqId && !search.woId)}
          onClick={onResetSearch}
        >
          Reset
        </Button>
        <Button type="primary" loading={loading.drawings} onClick={onSearch}>
          Search
        </Button>
      </Space>
    </Form>

    {validationMessage ? <Alert className="error-box" type="error" message={validationMessage} /> : null}
    {error ? <Alert className="error-box" type="error" message={error} /> : null}
  </section>
);

const DrawingResultsPanel = ({
  drawings,
  totalCount,
  filteredCount,
  loading,
  selectedWoId,
  filters,
  page,
  onFilterChange,
  onPageChange,
  onSelectDrawing,
  onDownload,
}) => (
  <section className="panel vc-pub-section vcsnofM001Style non-bim-drawing-panel">
    <div className="section-header">
      <div className="section-title">
        Manual Drawing Results{" "}
        <span className="muted">Total {totalCount} / Filtered {filteredCount}</span>
      </div>
      {loading.drawings ? <span className="muted">Searching...</span> : null}
    </div>
    <DrawingResultTable
      drawings={drawings}
      loading={loading}
      selectedWoId={selectedWoId}
      filters={filters}
      page={page}
      onFilterChange={onFilterChange}
      onPageChange={onPageChange}
      onSelectDrawing={onSelectDrawing}
      onDownload={onDownload}
    />
  </section>
);

export default Bim5DNotApplied;
