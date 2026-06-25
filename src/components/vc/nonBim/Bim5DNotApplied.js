import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Form, Input, Space } from "antd";

import { Bim5dMainStyle } from "../../../styles/vc/pumpingStyle";
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
  selectSelectedWoId,
  selectSelectedDrawing,
} from "../../../store/vc/nonBim/vcSimSelector";
import { MAX_CHAMBER_COUNT } from "./core/NonBim.constant";
import { isCalculationLockedByDrawingStatus } from "./core/NonBim.helper";
import VcDraftAttachPopup from "./popup/VcDraftAttachPopup";
import VcResultPopup from "./popup/VcResultPopup";
import SuggestInput from "../common/SuggestInput";
import { ChamberWorkspace } from "./ui/ChamberWorkspace";
import { DrawingResultTable } from "./ui/DrawingResultTable";

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
        drawings={drawings}
        loading={loading}
        selectedWoId={selectedWoId}
        onSelectDrawing={(woId) => dispatch(nonBimActions.selectDrawing(woId))}
        onDownload={(woId) => dispatch(nonBimActions.downloadForelineRequest(woId))}
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

const DrawingResultsPanel = ({ drawings, loading, selectedWoId, onSelectDrawing, onDownload }) => (
  <section className="panel vc-pub-section vcsnofM001Style">
    <div className="section-header">
      <div className="section-title">Manual Drawing Results</div>
      {loading.drawings ? <span className="muted">Searching...</span> : null}
    </div>
    <DrawingResultTable
      drawings={drawings}
      loading={loading}
      selectedWoId={selectedWoId}
      onSelectDrawing={onSelectDrawing}
      onDownload={onDownload}
    />
  </section>
);

export default Bim5DNotApplied;
