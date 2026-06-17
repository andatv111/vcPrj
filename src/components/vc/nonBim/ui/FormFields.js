import React from "react";

/** 공통 option 모델(value, label)을 사용하는 단일 선택 필드입니다. 변경 시 선택값만 상위로 전달합니다. */
export const SelectField = ({ label, placeholder = "-", value, options = [], disabled = false, readOnly = false, onChange }) => (
  <label className="field">
    <span>{label}</span>
    <select value={value || ""} disabled={disabled || readOnly} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value || option.label}>
          {option.label || option.value}
        </option>
      ))}
    </select>
  </label>
);

/** 계산 기준 또는 결과 기본정보처럼 사용자가 직접 수정하지 않는 값을 표시합니다. */
export const ReadonlyField = ({ label, value, className = "field narrow" }) => (
  <label className={className}>
    <span>{label}</span>
    <input value={value || ""} readOnly />
  </label>
);
