import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// 화면 공통 스타일은 실제 업무 화면에서 소유합니다.
// 퍼블리셔 산출물이 들어오면 ui 컴포넌트별 CSS로 분리해 이 import를 교체합니다.
import "../../../styles.css";

import vcCalculatorActions from "../../../store/vc/vcCalculator/action";
import {
  selectVcCalculatorActiveChamber,
  selectVcCalculatorChambers,
  selectVcCalculatorEquipment,
  selectVcCalculatorError,
  selectVcCalculatorLoading,
  selectVcCalculatorOptions,
} from "../../../store/vc/vcCalculator/vcSimSelector";
import { MAX_CHAMBER_COUNT } from "./core/NonBim.constant";
import VcDraftAttachPopup from "./popup/VcDraftAttachPopup";
import VcResultPopup from "./popup/VcResultPopup";
import { ChamberWorkspace } from "./ui/ChamberWorkspace";
import { SelectField } from "./ui/FormFields";

/**
 * 도면 선택 없이 FAB, Model, Chamber, 배관 정보를 직접 입력해 V/C를 계산하는 화면입니다.
 * Chamber 편집 UI와 결과 팝업은 Non-BIM 화면과 공유하고 상태는 Calculator 전용 Redux slice에서 관리합니다.
 */
const VcCalculator = () => {
  const dispatch = useDispatch();
  const equipment = useSelector(selectVcCalculatorEquipment);
  const options = useSelector(selectVcCalculatorOptions);
  const chambers = useSelector(selectVcCalculatorChambers);
  const activeChamber = useSelector(selectVcCalculatorActiveChamber);
  const loading = useSelector(selectVcCalculatorLoading);
  const error = useSelector(selectVcCalculatorError);

  useEffect(() => {
    // 최초 진입 시 FAB, Model, Model Standard 및 배관 유형 선택지를 조회합니다.
    dispatch(vcCalculatorActions.initRequest());
  }, [dispatch]);

  const handleChamberChange = (name, value) => {
    if (!activeChamber) return;
    // 현재 Chamber의 기준정보를 변경하고 Model Standard 연계 Spec은 reducer에서 동기화합니다.
    dispatch(vcCalculatorActions.updateChamberField({ chamberId: activeChamber.id, name, value }));
  };

  const handlePipeRowChange = (rowId, name, value) => {
    if (!activeChamber) return;
    // 현재 Chamber의 배관 행을 변경하며 유형별 비사용 필드와 숫자 형식은 reducer에서 정리합니다.
    dispatch(vcCalculatorActions.updatePipeRow({ chamberId: activeChamber.id, rowId, name, value }));
  };

  return (
    <main className="page embedded-page">
      {/* FAB 또는 Model 변경 시 reducer가 기존 Model Standard와 Spec을 초기화한 후 적용 가능한 기본값을 다시 설정합니다. */}
      <CalculatorSearchPanel
        equipment={equipment}
        options={options}
        onFieldChange={(name, value) => dispatch(vcCalculatorActions.setEquipmentField({ name, value }))}
      />

      {/*
        Chamber/배관 추가, 삭제, 선택, 수정은 Calculator reducer가 처리합니다.
        Calculate는 saga의 입력 검증, DTO 생성, API 호출 및 결과 팝업 흐름을 시작합니다.
      */}
      <ChamberWorkspace
        activeChamber={activeChamber}
        canAddChamber={chambers.length < MAX_CHAMBER_COUNT}
        canRemoveChamber={Boolean(activeChamber && chambers.length > 1)}
        canEditPipe={Boolean(activeChamber)}
        chambers={chambers}
        loading={loading}
        pipeTypeOptions={options.pipeTypes}
        selectedDrawing={{ sourceType: "CALCULATOR" }}
        addLabel="Add"
        removeLabel="Delete"
        title="Chamber / Pipe Information"
        emptyMessage="Add chamber information to calculate V/C."
        onAddChamber={() => dispatch(vcCalculatorActions.addChamber())}
        onRemoveChamber={(chamberId) => dispatch(vcCalculatorActions.removeChamber(chamberId))}
        onSetActiveChamber={(chamberId) => dispatch(vcCalculatorActions.setActiveChamber(chamberId))}
        onChamberChange={handleChamberChange}
        onAddPipeRow={() => activeChamber && dispatch(vcCalculatorActions.addPipeRow(activeChamber.id))}
        onRemovePipeRow={() => activeChamber && dispatch(vcCalculatorActions.removeSelectedPipeRow(activeChamber.id))}
        onSelectPipeRow={(rowId) =>
          activeChamber && dispatch(vcCalculatorActions.selectPipeRow({ chamberId: activeChamber.id, rowId }))
        }
        onPipeRowChange={handlePipeRowChange}
        onCalculate={() => dispatch(vcCalculatorActions.calculateRequest())}
      />

      {error ? <div className="error-box">{error}</div> : null}
      <VcResultPopup />
      <VcDraftAttachPopup />
    </main>
  );
};

/** Calculator 계산에 공통 적용할 FAB와 Model을 입력받는 상단 조건 영역입니다. */
const CalculatorSearchPanel = ({ equipment, options, onFieldChange }) => (
  <section className="panel">
    <div className="section-title">조회조건</div>
    <div className="search-row">
      <SelectField
        label="FAB"
        placeholder="전체"
        value={equipment.fab}
        options={options.fabs}
        onChange={(value) => onFieldChange("fab", value)}
      />
      <SelectField
        label="MODEL"
        placeholder="전체"
        value={equipment.model}
        options={options.models}
        onChange={(value) => onFieldChange("model", value)}
      />
    </div>
  </section>
);

export default VcCalculator;
