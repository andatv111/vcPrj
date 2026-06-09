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
  selectSelectedConstructionNo,
} from "../../../store/vc/nonBim/vcSimSelector";
import {
  DRAWING_COLUMNS,
  MAX_CHAMBER_COUNT,
  PIPE_COLUMNS,
  PIPE_TYPE_OPTIONS,
} from "./core/NonBim.constant";
import { isCalculationLockedByDrawingStatus, isPipeFieldEditable, toDisplayText } from "./core/NonBim.helper";
import VcDraftAttachPopup from "./popup/VcDraftAttachPopup";
import VcResultPopup from "./popup/VcResultPopup";

const h = React.createElement;
const pipeEditableFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

const Bim5DNotApplied = () => {
  const dispatch = useDispatch();
  const search = useSelector(selectSearch);
  const eqSuggestions = useSelector(selectEqSuggestions);
  const drawings = useSelector(selectDrawings);
  const selectedConstructionNo = useSelector(selectSelectedConstructionNo);
  const selectedDrawing = useSelector(selectSelectedDrawing);
  const chambers = useSelector(selectChambers);
  const activeChamber = useSelector(selectActiveChamber);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const canEditPipe = Boolean(selectedDrawing && activeChamber);
  const calculationLocked = isCalculationLockedByDrawingStatus(selectedDrawing?.requestStatus);

  useEffect(() => {
    // action: FETCH_EQ_SUGGESTIONS_REQUEST
    dispatch(nonBimActions.fetchEqSuggestionsRequest(search.eqId));
  }, [dispatch, search.eqId]);

  const handleSearchChange = (name) => (event) => {
    // action: SET_SEARCH_FIELD
    dispatch(nonBimActions.setSearchField({ name, value: event.target.value }));
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
      onResetSearch: () => dispatch(nonBimActions.resetSearch()),
      // action: FETCH_MANUAL_DRAWINGS_REQUEST
      onSearch: () => dispatch(nonBimActions.fetchManualDrawingsRequest()),
    }),
    h(DrawingPanel, {
      drawings,
      loading,
      selectedConstructionNo,
      // action: SELECT_DRAWING
      onSelectDrawing: (constructionNo) => dispatch(nonBimActions.selectDrawing(constructionNo)),
      // action: DOWNLOAD_FORELINE_REQUEST
      onDownload: (constructionNo) => dispatch(nonBimActions.downloadForelineRequest(constructionNo)),
    }),
    h(ChamberPanel, {
      activeChamber,
      canEditPipe,
      calculationLocked,
      chambers,
      loading,
      selectedDrawing,
      // action: ADD_CHAMBER
      onAddChamber: () => dispatch(nonBimActions.addChamber()),
      // action: REMOVE_CHAMBER
      onRemoveChamber: () => activeChamber && dispatch(nonBimActions.removeChamber(activeChamber.id)),
      // action: SET_ACTIVE_CHAMBER
      onSetActiveChamber: (chamberId) => dispatch(nonBimActions.setActiveChamber(chamberId)),
      onChamberChange: handleChamberChange,
      // action: ADD_PIPE_ROW
      onAddPipeRow: () => activeChamber && dispatch(nonBimActions.addPipeRow(activeChamber.id)),
      // action: REMOVE_SELECTED_PIPE_ROW
      onRemovePipeRow: () => activeChamber && dispatch(nonBimActions.removeSelectedPipeRow(activeChamber.id)),
      // action: SELECT_PIPE_ROW
      onSelectPipeRow: (rowId) =>
        activeChamber && dispatch(nonBimActions.selectPipeRow({ chamberId: activeChamber.id, rowId })),
      onPipeRowChange: handlePipeRowChange,
      // action: CALCULATE_REQUEST
      onCalculate: () => dispatch(nonBimActions.calculateRequest()),
    }),
    h(VcResultPopup),
    h(VcDraftAttachPopup)
  );
};

const SearchPanel = ({ search, eqSuggestions, error, loading, onSearchChange, onResetSearch, onSearch }) =>
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

const DrawingPanel = ({ drawings, loading, selectedConstructionNo, onSelectDrawing, onDownload }) =>
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
                  { key: row.id, className: selectedConstructionNo === row.id ? "selected-row" : "" },
                  h(
                    "td",
                    { className: "center" },
                    h("input", {
                      type: "radio",
                      name: "drawingRadio",
                      checked: selectedConstructionNo === row.id,
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
        { className: "field switch-field" },
        h("span", null, "Calculation Target"),
        h("input", {
          type: "checkbox",
          checked: Boolean(activeChamber.calculateEnabled),
          disabled: !activeChamber.modelStandard,
          onChange: (event) => onChamberChange("calculateEnabled", event.target.checked),
        })
      ),
      h(
        "label",
        { className: "field narrow" },
        h("span", null, "Min Spec"),
        h("input", {
          value: activeChamber.minSpec,
          readOnly: true,
        })
      ),
      h(
        "label",
        { className: "field narrow" },
        h("span", null, "Max Spec"),
        h("input", {
          value: activeChamber.maxSpec,
          readOnly: true,
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
