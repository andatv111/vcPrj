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
import VcResultPopup from "./popup/VcResultPopup";

const h = React.createElement;
const pipeFields = ["inletDiameter", "length", "angle", "outletDiameter", "quantity"];

const VcCalculator = () => {
  // 도면 없이 수동 조건만으로 V/C를 계산하는 화면입니다.
  // Non-BIM 화면과 같은 Chamber/배관 helper를 재사용해 입력 규칙을 일관되게 유지합니다.
  const dispatch = useDispatch();
  const equipment = useSelector(selectVcCalculatorEquipment);
  const options = useSelector(selectVcCalculatorOptions);
  const chambers = useSelector(selectVcCalculatorChambers);
  const activeChamber = useSelector(selectVcCalculatorActiveChamber);
  const loading = useSelector(selectVcCalculatorLoading);
  const error = useSelector(selectVcCalculatorError);
  const canSelectModelStandard = useSelector(selectCanSelectModelStandard);

  useEffect(() => {
    // Fab/Model/Model Standard 선택지는 화면 진입 시 saga를 통해 한 번 로드합니다.
    // action: INIT_REQUEST
    // 사용처: saga가 calculator option API를 호출하고, reducer가 options를 저장합니다.
    dispatch(vcCalculatorActions.initRequest());
  }, [dispatch]);

  return h(
    "main",
    { className: "page embedded-page" },
    h(SearchSection, {
      equipment,
      options,
      canSelectModelStandard,
      // action: SET_EQUIPMENT_FIELD
      // 사용처: reducer가 fab/model을 갱신하고, 필수 조합이 깨지면 modelStandard와 spec을 초기화합니다.
      onFieldChange: (name, value) => dispatch(vcCalculatorActions.setEquipmentField({ name, value })),
      // action: SET_MODEL_STANDARD
      // 사용처: reducer가 선택 기준의 min/max spec을 장비와 모든 Chamber에 동기화합니다.
      onModelStandardChange: (value) => dispatch(vcCalculatorActions.setModelStandard(value)),
    }),
    h(ChamberSection, {
      activeChamber,
      chambers,
      loading,
      // action: ADD_CHAMBER
      // 사용처: reducer가 수동 Chamber를 추가하고 activeChamberId를 새 Chamber로 전환합니다.
      onAddChamber: () => dispatch(vcCalculatorActions.addChamber()),
      // action: REMOVE_CHAMBER
      // 사용처: reducer가 최소 1개 Chamber를 남기고 삭제 후 activeChamberId를 보정합니다.
      onRemoveChamber: (chamberId) => dispatch(vcCalculatorActions.removeChamber(chamberId)),
      // action: SET_ACTIVE_CHAMBER
      // 사용처: reducer가 편집 대상 Chamber id를 변경합니다.
      onSetActiveChamber: (chamberId) => dispatch(vcCalculatorActions.setActiveChamber(chamberId)),
      // action: UPDATE_CHAMBER_FIELD
      // 사용처: reducer가 대상 Chamber의 단일 필드를 갱신합니다.
      onChamberChange: ({ chamberId, name, value }) =>
        dispatch(vcCalculatorActions.updateChamberField({ chamberId, name, value })),
      // action: ADD_PIPE_ROW
      // 사용처: reducer가 대상 Chamber에 기본 PIPE row를 추가합니다.
      onAddPipeRow: (chamberId) => dispatch(vcCalculatorActions.addPipeRow(chamberId)),
      // action: REMOVE_SELECTED_PIPE_ROW
      // 사용처: reducer가 선택된 pipe row를 삭제하고 마지막 row면 빈 row로 교체합니다.
      onRemovePipeRow: (chamberId) => dispatch(vcCalculatorActions.removeSelectedPipeRow(chamberId)),
      // action: SELECT_PIPE_ROW
      // 사용처: reducer가 삭제 대상 pipe row id를 저장합니다.
      onSelectPipeRow: ({ chamberId, rowId }) => dispatch(vcCalculatorActions.selectPipeRow({ chamberId, rowId })),
      // action: UPDATE_PIPE_ROW
      // 사용처: reducer가 숫자 입력을 정리하고 pipe type 정책에 맞게 row를 정규화합니다.
      onPipeRowChange: ({ chamberId, rowId, name, value }) =>
        dispatch(vcCalculatorActions.updatePipeRow({ chamberId, rowId, name, value })),
      // action: CALCULATE_REQUEST
      // 사용처: saga가 검증, payload 생성, 계산 API 호출, 공용 결과 팝업 오픈을 처리합니다.
      onCalculate: () => dispatch(vcCalculatorActions.calculateRequest()),
    }),
    error ? h("div", { className: "error-box" }, error) : null,
    h(VcResultPopup)
  );
};

const SearchSection = ({ equipment, options, canSelectModelStandard, onFieldChange, onModelStandardChange }) =>
  // 장비 기본정보 영역입니다. Fab와 Model이 모두 선택되어야 Model Standard를 고를 수 있습니다.
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
  // 단독 계산기는 사용자가 Chamber를 직접 늘리고 줄일 수 있으므로 최대 개수만 제한합니다.
  h(
    "section",
    { className: "panel" },
    h(
      "div",
      { className: "section-header" },
      h("div", { className: "section-title" }, "Chamber / 배관정보"),
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
  // 활성 Chamber의 이름과 배관 목록을 수정하고, 계산 요청 action을 발생시키는 편집기입니다.
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
      )
    ),
    h(
      "div",
      { className: "section-header compact" },
      h("div", { className: "section-title small" }, "배관정보"),
      h(
        "div",
        { className: "button-group" },
        h("button", { type: "button", className: "secondary-button", onClick: () => onAddPipeRow(activeChamber.id) }, "배관추가"),
        h(
          "button",
          {
            type: "button",
            className: "secondary-button",
            disabled: !activeChamber.selectedPipeRowId,
            onClick: () => onRemovePipeRow(activeChamber.id),
          },
          "배관삭제"
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
        loading.calculate ? "Calculating..." : "산출하기"
      )
    )
  );

const PipeGrid = ({ activeChamber, onSelectPipeRow, onPipeRowChange }) =>
  // 배관 row 입력 방식은 Non-BIM 화면과 동일합니다. 유형 변경 시 reducer에서 불필요한 컬럼을 정리합니다.
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
