import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// 화면 공통 스타일은 실제 업무 화면에서 소유합니다.
// 퍼블리셔 산출물이 들어오면 ui 컴포넌트별 CSS로 분리해 이 import를 교체합니다.
import "../../../vc.css";

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
import { ChamberWorkspace } from "./ui/ChamberWorkspace";
import { DrawingResultTable } from "./ui/DrawingResultTable";

/**
 * BIM/5D 미적용 Fab의 수기 도면 조회 및 V/C 계산 화면입니다.
 * Redux에는 검색, 도면 선택, Chamber 입력 상태를 보관하고 실제 API 호출은 saga에 위임합니다.
 */
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
  // 요청상태가 잠금 대상이면 이 화면의 Calculate 버튼만 숨기고 다른 메뉴 동작에는 영향을 주지 않습니다.
  const calculationLocked = isCalculationLockedByDrawingStatus(selectedDrawing?.requestStatus);

  useEffect(() => {
    // 최초 진입 시 FAB와 배관 유형 등 화면 구성에 필요한 공통 옵션을 조회합니다.
    dispatch(nonBimActions.initOptionsRequest());
  }, [dispatch]);

  useEffect(() => {
    // EQ ID 입력값이 바뀔 때마다 자동완성 조회를 요청합니다. saga에서 짧은 지연 후 마지막 입력만 처리합니다.
    dispatch(nonBimActions.fetchEqSuggestionsRequest(search.eqId));
  }, [dispatch, search.eqId]);

  useEffect(() => {
    if (search.fabCd !== sessionPrjtCd) {
      dispatch(nonBimActions.setSearchField({ name: "fabCd", value: sessionPrjtCd }));
    }
  }, [dispatch, search.fabCd, sessionPrjtCd]);

  const handleSearchChange = (name) => (event) => {
    // 검색조건은 Redux에 즉시 반영하며 EQ ID가 입력되면 기존 필수값 오류를 해제합니다.
    if (name === "eqId" && event.target.value.trim()) {
      setSearchValidationMessage("");
    }
    dispatch(nonBimActions.setSearchField({ name, value: event.target.value }));
  };

  const handleSearch = () => {
    // B/E 계약상 EQ ID는 필수이므로 유효하지 않은 요청은 saga 호출 전에 차단합니다.
    if (!search.eqId.trim()) {
      setSearchValidationMessage("EQ ID는 필수 입력조건입니다.");
      return;
    }

    setSearchValidationMessage("");
    // saga가 현재 Redux 검색조건으로 수기 도면 목록을 조회하고 기존 선택 상태를 초기화합니다.
    dispatch(nonBimActions.fetchManualDrawingsRequest());
  };

  const handleChamberChange = (name, value) => {
    if (!activeChamber) return;
    // 현재 탭의 Model Standard 또는 산출대상 값을 변경하고 연계 Spec 값은 reducer에서 함께 보정합니다.
    dispatch(nonBimActions.updateChamberField({ chamberId: activeChamber.id, name, value }));
  };

  const handlePipeRowChange = (rowId, name, value) => {
    if (!activeChamber) return;
    // 현재 Chamber의 배관 행을 수정하며 숫자 형식과 유형별 사용 가능 필드는 reducer에서 정리합니다.
    dispatch(nonBimActions.updatePipeRow({ chamberId: activeChamber.id, rowId, name, value }));
  };

  return (
    <main className="page embedded-page vc-pub-screen vcsnof-m001">
      {/* Reset은 검색조건과 자동완성만 초기화하며 이미 조회된 도면 목록은 유지합니다. */}
      <NonBimSearchPanel
        search={search}
        eqSuggestions={eqSuggestions}
        error={error}
        validationMessage={searchValidationMessage}
        loading={loading}
        onSearchChange={handleSearchChange}
        onResetSearch={() => dispatch(nonBimActions.resetSearch())}
        onSearch={handleSearch}
      />

      {/* 선택 action은 상세 조회를 시작하고 다운로드 action은 선택 row의 파일 식별자를 saga에 전달합니다. */}
      <DrawingResultsPanel
        drawings={drawings}
        loading={loading}
        selectedWoId={selectedWoId}
        onSelectDrawing={(woId) => dispatch(nonBimActions.selectDrawing(woId))}
        onDownload={(woId) => dispatch(nonBimActions.downloadForelineRequest(woId))}
      />

      {/*
        Chamber/배관 추가, 삭제, 선택, 수정은 reducer가 처리합니다.
        Calculate는 saga의 입력 검증, DTO 생성, API 호출 및 결과 팝업 흐름을 시작합니다.
      */}
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

/** 검색조건 입력과 조회 실행을 담당하는 표시 컴포넌트입니다. 실제 상태 변경은 상위 callback으로 전달합니다. */
const NonBimSearchPanel = ({
  search,
  eqSuggestions,
  error,
  validationMessage,
  loading,
  onSearchChange,
  onResetSearch,
  onSearch,
}) => (
  <section className="panel vc-pub-section searchStyle">
    <div className="section-title">Search Conditions</div>
    <div className="search-row vc-pub-search-row">
      <label className="field">
        <span>FAB</span>
        <input value={search.fabCd} readOnly />
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
        <span>WO ID</span>
        <input
          placeholder="WO ID"
          value={search.woId}
          onChange={onSearchChange("woId")}
        />
      </label>

      <button
        type="button"
        className="secondary-button"
        disabled={loading.drawings || (!search.fabCd && !search.eqId && !search.woId)}
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

/** 조회된 수기 도면 목록과 현재 선택 상태를 테이블 컴포넌트에 전달합니다. */
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
