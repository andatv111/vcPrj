import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import Bim5DNotApplied from "./components/vc/nonBim/Bim5DNotApplied";
import VcCalculator from "./components/vc/nonBim/VcCalculator";
import { store } from "./store";
// import "./styles.css";

const h = React.createElement;

// JSX 없이 React.createElement를 쓰는 미리보기 엔트리입니다.
// 실제 업무 화면은 좌측 메뉴의 activeMenuId에 따라 ContentRouter에서 전환됩니다.
const menuItems = [
  {
    id: "nonBimFab",
    group: "V/C Simulation",
    label: "BIM/5D Not Applied Fab",
    description: "Manual drawing based V/C simulation",
  },
  {
    id: "calculator",
    group: "V/C Simulation",
    label: "V/C Calculator",
    description: "Manual chamber and pipe V/C calculation",
  },
  {
    id: "testData",
    group: "Preview",
    label: "Test Data Guide",
    description: "Sample EQ IDs and expected scenarios",
  },
];

function App() {
  const [activeMenuId, setActiveMenuId] = useState("nonBimFab");

  // 메뉴 ID만 상태로 들고, 화면 상단에 보여줄 메타 정보는 매 렌더마다 안전하게 조회합니다.
  const activeMenu = useMemo(
    () => menuItems.find((item) => item.id === activeMenuId) || menuItems[0],
    [activeMenuId]
  );

  return h(
    "div",
    { className: "app-shell" },
    h(SideMenu, { activeMenuId, onSelect: setActiveMenuId }),
    h(
      "section",
      { className: "content-shell" },
      h(
        "header",
        { className: "content-topbar" },
        h("div", null, h("div", { className: "breadcrumb" }, activeMenu.group), h("h1", null, activeMenu.label)),
        h("span", { className: "status-pill" }, "React JS Preview")
      ),
      h(ContentRouter, { activeMenuId })
    )
  );
}

function SideMenu({ activeMenuId, onSelect }) {
  return h(
    "aside",
    { className: "side-menu" },
    h("div", { className: "side-title" }, "VC Preview"),
    h(
      "nav",
      { className: "menu-list" },
      menuItems.map((item) =>
        h(
          "button",
          {
            key: item.id,
            type: "button",
            className: item.id === activeMenuId ? "menu-item active" : "menu-item",
            onClick: () => onSelect(item.id),
          },
          h("span", { className: "menu-label" }, item.label),
          h("span", { className: "menu-description" }, item.description)
        )
      )
    )
  );
}

function ContentRouter({ activeMenuId }) {
  // 메뉴가 늘어날 경우 이 함수에 화면 컴포넌트를 추가하면 전체 shell 구조는 그대로 재사용됩니다.
  if (activeMenuId === "calculator") return h(VcCalculator);
  if (activeMenuId === "testData") return h(TestDataGuide);
  return h(Bim5DNotApplied);
}

function TestDataGuide() {
  const rows = [
    ["EQ-VAC-ETCH-1001", "3 chambers", "Pipe, Elbow, Reducer mixed. Good for tab and row editing."],
    ["EQ-VAC-CVD-2204", "2 chambers", "Spec ranges can produce IN, HIGH_OUT, and LOW_OUT after edits."],
    ["EQ-VAC-PUMP-3307", "No spec range", "Judge returns NONE when no min/max spec is applied."],
    ["EQ-VAC-TEST-9009", "Boundary", "Small lab data for strict min/max spec validation."],
  ];

  return h(
    "main",
    { className: "page compact-page" },
    h(
      "section",
      { className: "panel" },
      h("div", { className: "section-title" }, "Sample Data"),
      h(
        "div",
        { className: "table-wrap" },
        h(
          "table",
          null,
          h(
            "thead",
            null,
            h("tr", null, h("th", null, "EQ ID"), h("th", null, "Case"), h("th", null, "Use For"))
          ),
          h(
            "tbody",
            null,
            rows.map((row) =>
              h(
                "tr",
                { key: row[0] },
                h("td", null, row[0]),
                h("td", null, row[1]),
                h("td", null, row[2])
              )
            )
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  h(React.StrictMode, null, h(Provider, { store }, h(App)))
);
