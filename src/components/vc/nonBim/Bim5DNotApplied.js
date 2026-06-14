import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// 화면 공통 스타일은 실제 업무 화면에서 소유합니다.
// 퍼블리셔 산출물이 들어오면 ui 컴포넌트별 CSS로 분리해 이 import를 교체합니다.
import "../../../styles.css";

import nonBimActions from "../../../store/vc/nonBim/action";
import {
  selectActiveChamber,
  selectChambers,
  selectDrawings,
  selectEqSuggestions,
  selectError,
  selectLoading,
  selectNonBimOptions,
  selectSearch,
  selectSelectedConstructionNo,
  selectSelectedDrawing,
} from "../../../store/vc/nonBim/vcSimSelector";
import { MAX_CHAMBER_COUNT } from "./core/NonBim.constant";
import { isCalculationLockedByDrawingStatus } from "./core/NonBim.helper";
import VcDraftAttachPopup from "./popup/VcDraftAttachPopup";
import VcResultPopup from "./popup/VcResultPopup";
import { ChamberWorkspace } from "./ui/ChamberWorkspace";
import { DrawingResultTable } from "./ui/DrawingResultTable";

const Bim5DNotApplied = () => {
  const dispatch = useDispatch();
  const search = useSelector(selectSearch);
  const options = useSelector(selectNonBimOptions);
  const eqSuggestions = useSelector(selectEqSuggestions);
  const drawings = useSelector(selectDrawings);
  const selectedConstructionNo = useSelector(selectSelectedConstructionNo);
  const selectedDrawing = useSelector(selectSelectedDrawing);
  const chambers = useSelector(selectChambers);
  const activeChamber = useSelector(selectActiveChamber);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const [searchValidationMessage, setSearchValidationMessage] = useState("");

  const canEditPipe = Boolean(selectedDrawing && activeChamber);
  const calculationLocked = isCalculationLockedByDrawingStatus(selectedDrawing?.requestStatus);

  useEffect(() => {
    dispatch(nonBimActions.initOptionsRequest());
  }, [dispatch]);

  useEffect(() => {
    // action: FETCH_EQ_SUGGESTIONS_REQUEST - EQ ID 입력값 변경 시 B/E 자동완성 후보를 조회합니다.
    dispatch(nonBimActions.fetchEqSuggestionsRequest(search.eqId));
  }, [dispatch, search.eqId]);

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
    // action: FETCH_MANUAL_DRAWINGS_REQUEST
    dispatch(nonBimActions.fetchManualDrawingsRequest());
  };

  const handleChamberChange = (name, value) => {
    if (!activeChamber) return;
    // action: UPDATE_CHAMBER_FIELD
    dispatch(nonBimActions.updateChamberField({ chamberId: activeChamber.id, name, value }));
  };

  const handlePipeRowChange = (rowId, name, value) => {
    if (!activeChamber) return;
    // action: UPDATE_PIPE_ROW
    dispatch(nonBimActions.updatePipeRow({ chamberId: activeChamber.id, rowId, name, value }));
  };

  return (
    <main className="page embedded-page">
      <NonBimSearchPanel
        search={search}
        fabOptions={options.fabs}
        eqSuggestions={eqSuggestions}
        error={error}
        validationMessage={searchValidationMessage}
        loading={loading}
        onSearchChange={handleSearchChange}
        onResetSearch={() => dispatch(nonBimActions.resetSearch())}
        onSearch={handleSearch}
      />

      <DrawingResultsPanel
        drawings={drawings}
        loading={loading}
        selectedConstructionNo={selectedConstructionNo}
        onSelectDrawing={(constructionNo) => dispatch(nonBimActions.selectDrawing(constructionNo))}
        onDownload={(constructionNo) => dispatch(nonBimActions.downloadForelineRequest(constructionNo))}
      />

      <ChamberWorkspace
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
    </main>
  );
};

const NonBimSearchPanel = ({
  search,
  fabOptions,
  eqSuggestions,
  error,
  validationMessage,
  loading,
  onSearchChange,
  onResetSearch,
  onSearch,
}) => (
  <section className="panel">
    <div className="section-title">Search Conditions</div>
    <div className="search-row">
      <label className="field">
        <span>FAB</span>
        <select value={search.fab} onChange={onSearchChange("fab")}>
          <option value="">전체</option>
          {fabOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>EQ ID</span>
        <input
          list="eqSuggestionList"
          placeholder="Equipment ID"
          value={search.eqId}
          onChange={onSearchChange("eqId")}
        />
        <datalist id="eqSuggestionList">
          {eqSuggestions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </datalist>
      </label>

      <label className="field">
        <span>Construction No.</span>
        <input
          placeholder="Construction No."
          value={search.constructionNo}
          onChange={onSearchChange("constructionNo")}
        />
      </label>

      <button
        type="button"
        className="secondary-button"
        disabled={loading.drawings || (!search.fab && !search.eqId && !search.constructionNo)}
        onClick={onResetSearch}
      >
        Reset
      </button>
      <button type="button" className="primary-button" disabled={loading.drawings} onClick={onSearch}>
        {loading.drawings ? "Searching..." : "Search"}
      </button>
    </div>

    {validationMessage ? <div className="error-box">{validationMessage}</div> : null}
    {error ? <div className="error-box">{error}</div> : null}
  </section>
);

const DrawingResultsPanel = ({ drawings, loading, selectedConstructionNo, onSelectDrawing, onDownload }) => (
  <section className="panel">
    <div className="section-header">
      <div className="section-title">Manual Drawing Results</div>
      {loading.drawings ? <span className="muted">Searching...</span> : null}
    </div>
    <DrawingResultTable
      drawings={drawings}
      loading={loading}
      selectedConstructionNo={selectedConstructionNo}
      onSelectDrawing={onSelectDrawing}
      onDownload={onDownload}
    />
  </section>
);

export default Bim5DNotApplied;
