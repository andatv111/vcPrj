import React, { useMemo, useState } from "react";
import { Form, Input, Space } from "antd";

const normalizeItem = (item) => {
  if (typeof item === "string") return { value: item, label: item };
  return {
    value: String(item?.value ?? item?.eqId ?? item?.specNm ?? ""),
    label: String(item?.label ?? item?.name ?? item?.specNm ?? item?.value ?? ""),
  };
};

const SuggestInput = ({
  label,
  value,
  placeholder,
  items = [],
  disabled = false,
  showDescription = false,
  onChange,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const normalizedItems = useMemo(
    () => items.map(normalizeItem).filter((item) => item.value),
    [items]
  );
  const showList = open && String(value || "").trim().length > 0 && normalizedItems.length > 0;

  const chooseItem = (nextValue) => {
    onChange(nextValue);
    if (onSelect) onSelect(nextValue);
    setOpen(false);
  };

  return (
    <Form.Item className="signlw-form-item vc-suggest-field" label={label} colon={false}>
      <Input
        value={value || ""}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setOpen(true);
          onChange(event.target.value);
        }}
      />
      {showList ? (
        <div className="vc-suggest-list">
          {normalizedItems.map((item) => (
            <button
              type="button"
              className="vc-suggest-item"
              key={item.value}
              onMouseDown={(event) => {
                event.preventDefault();
                chooseItem(item.value);
              }}
            >
              <Space direction="vertical" size={0}>
                <span>{item.value}</span>
                {showDescription && item.label && item.label !== item.value ? <small>{item.label}</small> : null}
              </Space>
            </button>
          ))}
        </div>
      ) : null}
    </Form.Item>
  );
};

export default SuggestInput;
