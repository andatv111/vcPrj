import React from "react";

const Header = ({ activeMenu, statusLabel = "" }) => (
  <header className="content-topbar">
    <div>
      <div className="breadcrumb">{activeMenu.group}</div>
      <h1>{activeMenu.label}</h1>
    </div>
    <span className="status-pill">{statusLabel}</span>
  </header>
);

export default Header;
