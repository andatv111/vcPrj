import React from "react";
import { Form, Input, Select } from "antd";

import { toDisplayText } from "../core/NonBim.helper";

const toSelectOptions = (options = []) =>
  options.map((option) => ({
    label: option.label || option.value,
    value: option.value || option.label,
  }));

export const SelectField = ({ label, placeholder = "-", value, options = [], disabled = false, readOnly = false, onChange }) => (
  <Form.Item className="signlw-form-item" label={label} colon={false}>
    <Select
      allowClear
      showSearch
      value={value || undefined}
      disabled={disabled || readOnly}
      placeholder={placeholder}
      options={toSelectOptions(options)}
      optionFilterProp="label"
      onChange={(nextValue) => onChange(nextValue || "")}
    />
  </Form.Item>
);

export const ReadonlyField = ({ label, value, className = "signlw-form-item field narrow" }) => (
  <Form.Item className={className} label={label} colon={false}>
    <Input value={toDisplayText(value)} readOnly />
  </Form.Item>
);
