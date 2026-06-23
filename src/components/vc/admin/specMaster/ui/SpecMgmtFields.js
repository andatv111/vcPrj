import React from "react";

export const SelectField = ({ label, value, options = [], required = false, disabled = false, full = false, onChange }) => (
  <label className={full ? "field signlw-form-item full-grid-field" : "field signlw-form-item"}>
    <span>{label}{required ? <em className="required-mark">*</em> : null}</span>
    <select value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="">전체</option>
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value || option.label}>
          {option.label || option.value}
        </option>
      ))}
    </select>
  </label>
);

export const InputField = ({ label, value, required = false, disabled = false, full = false, onChange }) => (
  <label className={full ? "field signlw-form-item full-grid-field" : "field signlw-form-item"}>
    <span>{label}{required ? <em className="required-mark">*</em> : null}</span>
    <input value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
  </label>
);

export const SwitchField = ({ label, value, onChange }) => (
  <label className="vc-switch-field spec-switch">
    <span className="vc-switch-label">{label}</span>
    <input type="checkbox" checked={value === "Y"} onChange={(event) => onChange(event.target.checked ? "Y" : "N")} />
    <span className="vc-switch-track" aria-hidden="true">
      <span className="vc-switch-thumb" />
    </span>
    <span className="vc-switch-value">{value === "Y" ? "Y" : "N"}</span>
  </label>
);
