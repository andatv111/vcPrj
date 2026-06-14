import React from "react";

export const SelectField = ({ label, placeholder = "-", value, options = [], disabled = false, onChange }) => (
  <label className="field">
    <span>{label}</span>
    <select value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value || option.label}>
          {option.label || option.value}
        </option>
      ))}
    </select>
  </label>
);

export const ReadonlyField = ({ label, value, className = "field narrow" }) => (
  <label className={className}>
    <span>{label}</span>
    <input value={value || ""} readOnly />
  </label>
);
