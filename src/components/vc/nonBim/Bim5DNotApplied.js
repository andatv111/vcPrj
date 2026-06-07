import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import nonBimActions from "../../../store/vc/nonBim/action";
import {
  selectActiveChamber,
  selectChambers,
  selectDrawings,
  selectEqSuggestions,
  selectError,
  selectLoading,
  selectSearch,
  selectSelectedDrawing,
  selectSelectedDrawingId,
} from "../../../store/vc/nonBim/vcSimSelector";
import {
  DRAWING_COLUMNS,
  MAX_CHAMBER_COUNT,
  PIPE_COLUMNS,
  PIPE_TYPE_OPTIONS,
} from "./core/NonBim.constant";
import { isCalculationLockedByDrawingStatus, isPipeFieldEditable, toDisplayText } from "./core/NonBim.helper";
import VcResultPopup from "./popup/VcResultPopup";

const h = React.createElement;
const pipeEditableFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

const Bim5DNotApplied = () => {
  // 화면은 Redux state를 읽고, 모든 사용자 이벤트는 action으로만 전달합니다.
  // API 호출과 복잡한 상태 변경은 saga/reducer에서 담당해 컴포넌트는 렌더링에 집중합니다.
  const dispatch = useDispatch();
  const search = useSelector(selectSearch);
  const eqSuggestions = useSelector(selectEqSuggestions);
  const drawings = useSelector(selectDrawings);
  const selectedDrawingId = useSelector(selectSelectedDrawingId);
  const selectedDrawing = useSelector(selectSelectedDrawing);
  const chambers = useSelector(selectChambers);
  const activeChamber = useSelector(selectActiveChamber);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const canEditPipe = Boolean(selectedDrawing && activeChamber);
  const calculationLocked = isCalculationLockedByDrawingStatus(selectedDrawing?.requestStatus);

  useEffect(() => {
    // EQ ID 입력값이 바뀔 때마다 saga에서 debounce 후 자동완성 후보를 조회합니다.
    // action: FETCH_EQ_SUGGESTIONS_REQUEST
    // 사용처: saga가 keyword로 후보 EQ 목록을 조회하고, reducer가 eqSuggestions를 갱신합니다.
    dispatch(nonBimActions.fetchEqSuggestionsRequest(search.eqId));
  }, [dispatch, search.eqId]);

  const handleSearchChange = (name) => (event) => {
    // action: SET_SEARCH_FIELD
    // 사용처: reducer가 search[name]만 갱신합니다. eqId 변경 시 위 useEffect가 자동완성 조회를 이어서 요청합니다.
    dispatch(nonBimActions.setSearchField({ name, value: event.target.value }));
  };

  const handleChamberChange = (name, value) => {
    if (!activeChamber) return;

    // action: UPDATE_CHAMBER_FIELD
    // 사용처: reducer가 활성 Chamber의 단일 필드를 바꾸고, modelStandard/minSpec/maxSpec은 업무 규칙에 맞게 보정합니다.
    dispatch(nonBimActions.updateChamberField({ chamberId: activeChamber.id, name, value }));
  };

  const handlePipeRowChange = (rowId, name, value) => {
    if (!activeChamber) return;

    // action: UPDATE_PIPE_ROW
    // 사용처: reducer가 선택 row 값을 숫자형 문자열로 정리하고, pipe type 정책에 맞게 불필요한 컬럼을 비웁니다.
    dispatch(nonBimActions.updatePipeRow({ chamberId: activeChamber.id, rowId, name, value }));
  };

  return h(
    "main",
    { className: "page embedded-page" },
    h(SearchPanel, {
      search,
      eqSuggestions,
      error,
      loading,
      onSearchChange: handleSearchChange,
      // action: RESET_SEARCH
      // 사용처: reducer가 검색 조건과 EQ 자동완성 후보를 초기 상태로 되돌립니다.
      onResetSearch: () => dispatch(nonBimActions.resetSearch()),
      // action: FETCH_MANUAL_DRAWINGS_REQUEST
      // 사용처: saga가 현재 search state로 도면 목록 API를 호출하고, reducer가 drawings를 갱신합니다.
      onSearch: () => dispatch(nonBimActions.fetchManualDrawingsRequest()),
    }),
    h(DrawingPanel, {
      drawings,
      loading,
      selectedDrawingId,
      // action: SELECT_DRAWING
      // 사용처: reducer가 selectedDrawing/chambers/activeChamberId를 만들고, saga가 spec option을 추가 조회합니다.
      onSelectDrawing: (drawingId) => dispatch(nonBimActions.selectDrawing(drawingId)),
      // action: DOWNLOAD_FORELINE_REQUEST
      // 사용처: saga가 선택 row의 foreline fileId로 Blob을 받아 브라우저 다운로드를 실행합니다.
      onDownload: (drawingId) => dispatch(nonBimActions.downloadForelineRequest(drawingId)),
    }),
    h(ChamberPanel, {
      activeChamber,
      canEditPipe,
      calculationLocked,
      chambers,
      loading,
      selectedDrawing,
      // action: ADD_CHAMBER
      // 사용처: reducer가 사용자 추가 Chamber를 생성합니다. 현재 업무화면 버튼은 비활성이라 향후 활성화 시 쓰입니다.
      onAddChamber: () => dispatch(nonBimActions.addChamber()),
      // action: REMOVE_CHAMBER
      // 사용처: reducer가 locked=false인 사용자 추가 Chamber만 삭제합니다.
      onRemoveChamber: () => activeChamber && dispatch(nonBimActions.removeChamber(activeChamber.id)),
      // action: SET_ACTIVE_CHAMBER
      // 사용처: reducer가 편집 대상 Chamber id를 바꿉니다.
      onSetActiveChamber: (chamberId) => dispatch(nonBimActions.setActiveChamber(chamberId)),
      onChamberChange: handleChamberChange,
      // action: ADD_PIPE_ROW
      // 사용처: reducer가 활성 Chamber에 기본 PIPE row를 추가합니다.
      onAddPipeRow: () => activeChamber && dispatch(nonBimActions.addPipeRow(activeChamber.id)),
      // action: REMOVE_SELECTED_PIPE_ROW
      // 사용처: reducer가 radio로 선택한 pipe row를 삭제하고, 마지막 row면 빈 row 하나로 교체합니다.
      onRemovePipeRow: () => activeChamber && dispatch(nonBimActions.removeSelectedPipeRow(activeChamber.id)),
      // action: SELECT_PIPE_ROW
      // 사용처: reducer가 삭제 대상 pipe row id를 저장합니다.
      onSelectPipeRow: (rowId) =>
        activeChamber && dispatch(nonBimActions.selectPipeRow({ chamberId: activeChamber.id, rowId })),
      onPipeRowChange: handlePipeRowChange,
      // action: CALCULATE_REQUEST
      // 사용처: saga가 검증, payload 생성, 계산 API 호출, 공용 결과 팝업 오픈을 순서대로 처리합니다.
      onCalculate: () => dispatch(nonBimActions.calculateRequest()),
    }),
    h(VcResultPopup)
  );
};

const SearchPanel = ({ search, eqSuggestions, error, loading, onSearchChange, onResetSearch, onSearch }) =>
  // 검색 조건 패널입니다. EQ ID는 datalist 자동완성을 쓰고, Search 버튼으로 도면 목록을 조회합니다.
  h(
    "section",
    { className: "panel" },
    h("div", { className: "section-title" }, "Search Conditions"),
    h(
      "div",
      { className: "search-row" },
      h(
        "label",
        { className: "field" },
        h("span", null, "EQ ID"),
        h("input", {
          list: "eqSuggestionList",
          placeholder: "Equipment ID",
          value: search.eqId,
          onChange: onSearchChange("eqId"),
        }),
        h(
          "datalist",
          { id: "eqSuggestionList" },
          eqSuggestions.map((item) =>
            h("option", { key: item.value, value: item.value }, item.label)
          )
        )
      ),
      h(
        "label",
        { className: "field" },
        h("span", null, "Construction No."),
        h("input", {
          placeholder: "Construction No.",
          value: search.constructionNo,
          onChange: onSearchChange("constructionNo"),
        })
      ),
      h(
        "button",
        {
          type: "button",
          className: "secondary-button",
          disabled: loading.drawings || (!search.eqId && !search.constructionNo),
          onClick: onResetSearch,
        },
        "Reset"
      ),
      h(
        "button",
        { type: "button", className: "primary-button", disabled: loading.drawings, onClick: onSearch },
        loading.drawings ? "Searching..." : "Search"
      )
    ),
    error ? h("div", { className: "error-box" }, error) : null
  );

const DrawingPanel = ({ drawings, loading, selectedDrawingId, onSelectDrawing, onDownload }) =>
  // 조회 결과 도면을 하나 선택하면 reducer가 해당 도면 기준으로 Chamber/배관 편집 상태를 생성합니다.
  h(
    "section",
    { className: "panel" },
    h(
      "div",
      { className: "section-header" },
      h("div", { className: "section-title" }, "Manual Drawing Results"),
      loading.drawings ? h("span", { className: "muted" }, "Searching...") : null
    ),
    h(
      "div",
      { className: "table-wrap" },
      h(
        "table",
        null,
        h("thead", null, h("tr", null, DRAWING_COLUMNS.map((column) => h("th", { key: column.key }, column.label)))),
        h(
          "tbody",
          null,
          drawings.length === 0
            ? h(
                "tr",
                null,
                h(
                  "td",
                  { colSpan: DRAWING_COLUMNS.length, className: "empty-cell" },
                  "No drawings found. Press Search to load sample data."
                )
              )
            : drawings.map((row) =>
                h(
                  "tr",
                  { key: row.id, className: selectedDrawingId === row.id ? "selected-row" : "" },
                  h(
                    "td",
                    { className: "center" },
                    h("input", {
                      type: "radio",
                      name: "drawingRadio",
                      checked: selectedDrawingId === row.id,
                      onChange: () => onSelectDrawing(row.id),
                    })
                  ),
                  h("td", null, toDisplayText(row.constructionNo)),
                  h("td", null, toDisplayText(row.eqId)),
                  h("td", null, toDisplayText(row.site)),
                  h("td", null, toDisplayText(row.fab)),
                  h("td", null, toDisplayText(row.area1)),
                  h("td", null, toDisplayText(row.area2)),
                  h("td", null, toDisplayText(row.changeType)),
                  h("td", null, toDisplayText(row.equipmentType)),
                  h("td", null, toDisplayText(row.requestStatus)),
                  h(
                    "td",
                    null,
                    h(
                      "div",
                      { className: "inline-actions" },
                      h("span", null, toDisplayText(row.foreline?.fileName || row.foreline?.categoryName)),
                      h(
                        "button",
                        {
                          type: "button",
                          className: "link-button",
                          disabled: loading.download,
                          onClick: () => onDownload(row.id),
                        },
                        "Download"
                      )
                    )
                  )
                )
              )
        )
      )
    )
  );

const ChamberPanel = (props) => {
  const {
    activeChamber,
    canEditPipe,
    calculationLocked,
    chambers,
    loading,
    selectedDrawing,
    onAddChamber,
    onRemoveChamber,
    onSetActiveChamber,
    onChamberChange,
    onAddPipeRow,
    onRemovePipeRow,
    onSelectPipeRow,
    onPipeRowChange,
    onCalculate,
  } = props;

  // Chamber 탭은 선택한 도면의 chamber 목록을 표시합니다.
  // locked Chamber는 원본 도면에서 온 데이터라 삭제를 막고, 사용자가 추가한 Chamber만 삭제할 수 있습니다.
  return h(
    "section",
    { className: "panel" },
    h(
      "div",
      { className: "section-header" },
      h("div", { className: "section-title" }, "Chamber / Pipe Information"),
      h(
        "div",
        { className: "button-group" },
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: !selectedDrawing || chambers.length >= MAX_CHAMBER_COUNT,
            title: selectedDrawing
              ? `Up to ${MAX_CHAMBER_COUNT} chambers. Original drawing chambers cannot be removed.`
              : "Select a drawing before adding a chamber.",
            onClick: onAddChamber,
          },
          "Add Chamber"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: !activeChamber || activeChamber.locked,
            onClick: onRemoveChamber,
          },
          "Remove"
        )
      )
    ),
    !selectedDrawing
      ? h("div", { className: "empty-box" }, "Select a drawing to edit chamber and pipe information.")
      : h(
          React.Fragment,
          null,
          h(
            "div",
            { className: "tab-bar" },
            chambers.map((chamber) =>
              h(
                "button",
                {
                  key: chamber.id,
                  type: "button",
                  className: activeChamber?.id === chamber.id ? "tab active" : "tab",
                  onClick: () => onSetActiveChamber(chamber.id),
                },
                `${chamber.name}${chamber.locked ? "" : " *"}`
              )
            )
          ),
          activeChamber
            ? h(ActiveChamberEditor, {
                activeChamber,
                canEditPipe,
                calculationLocked,
                loading,
                selectedDrawingStatus: selectedDrawing?.requestStatus,
                onChamberChange,
                onAddPipeRow,
                onRemovePipeRow,
                onSelectPipeRow,
                onPipeRowChange,
                onCalculate,
              })
            : null
        )
  );
};

const ActiveChamberEditor = ({
  activeChamber,
  canEditPipe,
  calculationLocked,
  loading,
  selectedDrawingStatus,
  onChamberChange,
  onAddPipeRow,
  onRemovePipeRow,
  onSelectPipeRow,
  onPipeRowChange,
  onCalculate,
}) =>
  // 활성 Chamber의 기준 정보와 배관 row를 한 번에 편집하는 영역입니다.
  // Model Standard를 바꾸면 reducer에서 Min/Max Spec도 같이 맞춥니다.
  h(
    React.Fragment,
    null,
    h(
      "div",
      { className: "form-grid" },
      h(
        "label",
        { className: "field" },
        h("span", null, "Chamber Name"),
        h("input", {
          value: activeChamber.name,
          onChange: (event) => onChamberChange("name", event.target.value),
        })
      ),
      h(
        "label",
        { className: "field" },
        h("span", null, "Model Standard"),
        h(
          "select",
          {
            value: activeChamber.modelStandard,
            onChange: (event) => onChamberChange("modelStandard", event.target.value),
          },
          activeChamber.specOptions.length
            ? activeChamber.specOptions.map((option) =>
                h("option", { key: option.value || option.label, value: option.value || option.label }, option.label)
              )
            : h("option", { value: "" }, "-")
        )
      ),
      h(
        "label",
        { className: "field narrow" },
        h("span", null, "Min Spec"),
        h("input", {
          value: activeChamber.minSpec,
          onChange: (event) => onChamberChange("minSpec", event.target.value),
        })
      ),
      h(
        "label",
        { className: "field narrow" },
        h("span", null, "Max Spec"),
        h("input", {
          value: activeChamber.maxSpec,
          onChange: (event) => onChamberChange("maxSpec", event.target.value),
        })
      )
    ),
    h(
      "div",
      { className: "section-header compact" },
      h("div", { className: "section-title small" }, "Pipe Rows"),
      h(
        "div",
        { className: "button-group" },
        h("button", { type: "button", className: "secondary-button", disabled: !canEditPipe, onClick: onAddPipeRow }, "Add"),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: !activeChamber.selectedPipeRowId,
            onClick: onRemovePipeRow,
          },
          "Remove"
        )
      )
    ),
    h(PipeTable, { activeChamber, onSelectPipeRow, onPipeRowChange }),
    h(
      "div",
      { className: "footer-actions" },
      calculationLocked
        ? h(
            "span",
            { className: "muted" },
            `Status: ${toDisplayText(selectedDrawingStatus)}`
          )
        : h(
            "button",
            {
              type: "button",
              className: "primary-button",
              disabled: loading.calculate,
              onClick: onCalculate,
            },
            "Calculate"
          )
      )
  );

const PipeTable = ({ activeChamber, onSelectPipeRow, onPipeRowChange }) =>
  // 배관 유형별 editable 정책은 helper의 isPipeFieldEditable을 통해 한 곳의 업무 규칙을 따릅니다.
  h(
    "div",
    { className: "table-wrap" },
    h(
      "table",
      null,
      h("thead", null, h("tr", null, PIPE_COLUMNS.map((column) => h("th", { key: column.key }, column.label)))),
      h(
        "tbody",
        null,
        activeChamber.pipeRows.map((row) =>
          h(
            "tr",
            { key: row.id },
            h(
              "td",
              { className: "center" },
              h("input", {
                type: "radio",
                name: `pipeRow_${activeChamber.id}`,
                checked: activeChamber.selectedPipeRowId === row.id,
                onChange: () => onSelectPipeRow(row.id),
              })
            ),
            h(
              "td",
              null,
              h(
                "select",
                { value: row.type, onChange: (event) => onPipeRowChange(row.id, "type", event.target.value) },
                PIPE_TYPE_OPTIONS.map((option) => h("option", { key: option.value, value: option.value }, option.label))
              )
            ),
            pipeEditableFields.map((fieldName) =>
              h(
                "td",
                { key: fieldName },
                h("input", {
                  value: row[fieldName],
                  disabled: !isPipeFieldEditable(row.type, fieldName),
                  onChange: (event) => onPipeRowChange(row.id, fieldName, event.target.value),
                })
              )
            )
          )
        )
      )
    )
  );

export default Bim5DNotApplied;
