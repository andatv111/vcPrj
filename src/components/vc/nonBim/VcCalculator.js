import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import vcCalculatorActions from "../../../store/vc/vcCalculator/action";
import {
  selectCanSelectModelStandard,
  selectVcCalculatorActiveChamber,
  selectVcCalculatorChambers,
  selectVcCalculatorEquipment,
  selectVcCalculatorError,
  selectVcCalculatorLoading,
  selectVcCalculatorOptions,
} from "../../../store/vc/vcCalculator/vcSimSelector";
import {
  MAX_CHAMBER_COUNT,
  PIPE_COLUMNS,
  PIPE_TYPE_OPTIONS,
} from "./core/NonBim.constant";
import { isPipeFieldEditable } from "./core/NonBim.helper";
import VcDraftAttachPopup from "./popup/VcDraftAttachPopup";
import VcResultPopup from "./popup/VcResultPopup";

const h = React.createElement;
const pipeFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

// V/C Calculator는 도면 선택 없이 수동 조건으로 계산하는 화면입니다.
// Non-BIM과 같은 Chamber/배관 모델을 사용해 결과 팝업, validation, payload 변환 로직을 공유합니다.
const VcCalculator = () => {
  const dispatch = useDispatch();
  const equipment = useSelector(selectVcCalculatorEquipment);
  const options = useSelector(selectVcCalculatorOptions);
  const chambers = useSelector(selectVcCalculatorChambers);
  const activeChamber = useSelector(selectVcCalculatorActiveChamber);
  const loading = useSelector(selectVcCalculatorLoading);
  const error = useSelector(selectVcCalculatorError);
  const canSelectModelStandard = useSelector(selectCanSelectModelStandard);

  useEffect(() => {
    // action: INIT_REQUEST - 화면 최초 진입 시 Fab/Model/Model Standard 선택지를 조회합니다.
    dispatch(vcCalculatorActions.initRequest());
  }, [dispatch]);

  return h(
    "main",
    { className: "page embedded-page" },
    h(SearchSection, {
      equipment,
      options,
      canSelectModelStandard,
      // action: SET_EQUIPMENT_FIELD - Fab/Model 변경 시 reducer가 Model Standard와 Spec 유효성을 다시 계산합니다.
      onFieldChange: (name, value) => dispatch(vcCalculatorActions.setEquipmentField({ name, value })),
      // action: SET_MODEL_STANDARD - 선택한 기준의 Min/Max Spec을 장비와 전체 Chamber에 반영합니다.
      onModelStandardChange: (value) => dispatch(vcCalculatorActions.setModelStandard(value)),
    }),
    h(ChamberSection, {
      activeChamber,
      chambers,
      loading,
      // action: ADD_CHAMBER
      onAddChamber: () => dispatch(vcCalculatorActions.addChamber()),
      // action: REMOVE_CHAMBER
      onRemoveChamber: (chamberId) => dispatch(vcCalculatorActions.removeChamber(chamberId)),
      // action: SET_ACTIVE_CHAMBER
      onSetActiveChamber: (chamberId) => dispatch(vcCalculatorActions.setActiveChamber(chamberId)),
      // action: UPDATE_CHAMBER_FIELD
      onChamberChange: ({ chamberId, name, value }) =>
        dispatch(vcCalculatorActions.updateChamberField({ chamberId, name, value })),
      // action: ADD_PIPE_ROW
      onAddPipeRow: (chamberId) => dispatch(vcCalculatorActions.addPipeRow(chamberId)),
      // action: REMOVE_SELECTED_PIPE_ROW
      onRemovePipeRow: (chamberId) => dispatch(vcCalculatorActions.removeSelectedPipeRow(chamberId)),
      // action: SELECT_PIPE_ROW
      onSelectPipeRow: ({ chamberId, rowId }) => dispatch(vcCalculatorActions.selectPipeRow({ chamberId, rowId })),
      // action: UPDATE_PIPE_ROW
      onPipeRowChange: ({ chamberId, rowId, name, value }) =>
        dispatch(vcCalculatorActions.updatePipeRow({ chamberId, rowId, name, value })),
      // action: CALCULATE_REQUEST
      onCalculate: () => dispatch(vcCalculatorActions.calculateRequest()),
    }),
    error ? h("div", { className: "error-box" }, error) : null,
    h(VcResultPopup),
    h(VcDraftAttachPopup)
  );
};

const SearchSection = ({ equipment, options, canSelectModelStandard, onFieldChange, onModelStandardChange }) =>
  h(
    "section",
    { className: "panel" },
    h("div", { className: "section-title" }, "장비 기본정보"),
    h(
      "div",
      { className: "search-row" },
      h(SelectField, {
        label: "Fab",
        placeholder: "전체",
        value: equipment.fab,
        options: options.fabs,
        onChange: (value) => onFieldChange("fab", value),
      }),
      h(SelectField, {
        label: "Model",
        placeholder: "전체",
        value: equipment.model,
        options: options.models,
        onChange: (value) => onFieldChange("model", value),
      }),
      h(SelectField, {
        label: "모델관리기준",
        placeholder: "전체",
        value: equipment.modelStandard,
        options: options.modelStandards,
        disabled: !canSelectModelStandard,
        onChange: onModelStandardChange,
      }),
      h(ReadonlyInline, { label: "Min Spec", value: equipment.minSpec }),
      h(ReadonlyInline, { label: "Max Spec", value: equipment.maxSpec })
    )
  );

const SelectField = ({ label, placeholder, value, options, disabled, onChange }) =>
  h(
    "label",
    { className: "field" },
    h("span", null, label),
    h(
      "select",
      { value, disabled, onChange: (event) => onChange(event.target.value) },
      h("option", { value: "" }, placeholder),
      options.map((option) => h("option", { key: option.value, value: option.value }, option.label))
    )
  );

const ReadonlyInline = ({ label, value }) =>
  h(
    "label",
    { className: "field narrow" },
    h("span", null, label),
    h("input", { value: value || "", readOnly: true })
  );

const ChamberSection = ({
  activeChamber,
  chambers,
  loading,
  onAddChamber,
  onRemoveChamber,
  onSetActiveChamber,
  onChamberChange,
  onAddPipeRow,
  onRemovePipeRow,
  onSelectPipeRow,
  onPipeRowChange,
  onCalculate,
}) =>
  // activeChamberId 하나로 탭과 편집 패널을 연결합니다.
  // 삭제 후 현재 탭이 사라지면 reducer가 첫 번째 남은 Chamber로 activeChamberId를 보정합니다.
  h(
    "section",
    { className: "panel" },
    h(
      "div",
      { className: "section-header" },
      h("div", { className: "section-title" }, "Chamber / 배관 정보"),
      h(
        "div",
        { className: "button-group" },
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: chambers.length >= MAX_CHAMBER_COUNT,
            onClick: onAddChamber,
          },
          "Add"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: !activeChamber || chambers.length <= 1,
            onClick: () => activeChamber && onRemoveChamber(activeChamber.id),
          },
          "Chamber 삭제"
        )
      )
    ),
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
          chamber.name
        )
      )
    ),
    activeChamber
      ? h(ChamberEditor, {
          activeChamber,
          loading,
          onChamberChange,
          onAddPipeRow,
          onRemovePipeRow,
          onSelectPipeRow,
          onPipeRowChange,
          onCalculate,
        })
      : null
  );

const ChamberEditor = ({
  activeChamber,
  loading,
  onChamberChange,
  onAddPipeRow,
  onRemovePipeRow,
  onSelectPipeRow,
  onPipeRowChange,
  onCalculate,
}) =>
  // Calculator는 장비 기준 Model Standard를 모든 Chamber에 공통 적용합니다.
  // 산출대상 checkbox는 Chamber별 제외 여부만 다루고, Spec 범위는 상단 장비 기준을 따릅니다.
  h(
    React.Fragment,
    null,
    h(
      "div",
      { className: "form-grid" },
      h(
        "label",
        { className: "field" },
        h("span", null, "Chamber"),
        h("input", {
          value: activeChamber.name,
          onChange: (event) =>
            onChamberChange({ chamberId: activeChamber.id, name: "name", value: event.target.value }),
        })
      ),
      h(
        "label",
        { className: "field switch-field" },
        h("span", null, "산출대상"),
        h("input", {
          type: "checkbox",
          checked: Boolean(activeChamber.calculateEnabled),
          disabled: !activeChamber.modelStandard,
          onChange: (event) =>
            onChamberChange({
              chamberId: activeChamber.id,
              name: "calculateEnabled",
              value: event.target.checked,
            }),
        })
      )
    ),
    h(
      "div",
      { className: "section-header compact" },
      h("div", { className: "section-title small" }, "배관 정보"),
      h(
        "div",
        { className: "button-group" },
        h("button", { type: "button", className: "secondary-button", onClick: () => onAddPipeRow(activeChamber.id) }, "배관 추가"),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: !activeChamber.selectedPipeRowId,
            onClick: () => onRemovePipeRow(activeChamber.id),
          },
          "배관 삭제"
        )
      )
    ),
    h(PipeGrid, { activeChamber, onSelectPipeRow, onPipeRowChange }),
    h(
      "div",
      { className: "footer-actions" },
      h(
        "button",
        { type: "button", className: "primary-button", disabled: loading.calculate, onClick: onCalculate },
        loading.calculate ? "계산 중..." : "산출하기"
      )
    )
  );

const PipeGrid = ({ activeChamber, onSelectPipeRow, onPipeRowChange }) =>
  // pipe row 선택은 삭제 대상을 표시하기 위한 상태입니다.
  // radio group name을 Chamber id로 분리해 탭을 이동해도 다른 Chamber의 row 선택을 침범하지 않습니다.
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
                name: `calcPipe_${activeChamber.id}`,
                checked: activeChamber.selectedPipeRowId === row.id,
                onChange: () => onSelectPipeRow({ chamberId: activeChamber.id, rowId: row.id }),
              })
            ),
            h(
              "td",
              null,
              h(
                "select",
                {
                  value: row.type,
                  onChange: (event) =>
                    onPipeRowChange({ chamberId: activeChamber.id, rowId: row.id, name: "type", value: event.target.value }),
                },
                PIPE_TYPE_OPTIONS.map((option) => h("option", { key: option.value, value: option.value }, option.label))
              )
            ),
            pipeFields.map((fieldName) =>
              h(
                "td",
                { key: fieldName },
                h("input", {
                  value: row[fieldName],
                  disabled: !isPipeFieldEditable(row.type, fieldName),
                  onChange: (event) =>
                    onPipeRowChange({
                      chamberId: activeChamber.id,
                      rowId: row.id,
                      name: fieldName,
                      value: event.target.value,
                    }),
                })
              )
            )
          )
        )
      )
    )
  );

export default VcCalculator;
