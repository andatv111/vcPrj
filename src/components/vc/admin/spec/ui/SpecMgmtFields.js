import React from "react";
import { Form, Input, Select, Switch } from "antd";

const toSelectOptions = (options = []) =>
  options.map((option) => ({
    label: option.label || option.value,
    value: option.value || option.label,
  }));

export const SelectField = ({
  label,
  value,
  options = [],
  required = false,
  disabled = false,
  full = false,
  placeholder = "All",
  onChange,
}) => (
  <Form.Item
    className={full ? "signlw-form-item full-grid-field" : "signlw-form-item"}
    label={label}
    required={required}
    colon={false}
  >
    <Select
      allowClear
      showSearch
      value={value || undefined}
      disabled={disabled}
      placeholder={placeholder}
      options={toSelectOptions(options)}
      optionFilterProp="label"
      onChange={(nextValue) => onChange(nextValue || "")}
    />
  </Form.Item>
);

export const InputField = ({ label, value, required = false, disabled = false, full = false, onChange }) => (
  <Form.Item
    className={full ? "signlw-form-item full-grid-field" : "signlw-form-item"}
    label={label}
    required={required}
    colon={false}
  >
    <Input value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
  </Form.Item>
);

export const SwitchField = ({ label, value, onChange }) => (
  <Form.Item className="signlw-form-item spec-switch" label={label} colon={false}>
    <Switch checked={value === "Y"} checkedChildren="Y" unCheckedChildren="N" onChange={(checked) => onChange(checked ? "Y" : "N")} />
  </Form.Item>
);
