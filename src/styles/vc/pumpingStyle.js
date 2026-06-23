import styled, { css } from "styled-components";

/*
 * BIM/5D 미적용Fab, SpecMaster - 상단 조건검색과 grid count 영역
 * 사용 class: search_area, searchStyle, search, signlw-form-item
 */
export const SearchStyle = css`
  .search_area,
  .searchStyle {
    border-top: 3px solid #2f6f73;
  }

  .search,
  .section-header.search {
    align-items: center;
  }

  .field,
  .signlw-form-item {
    min-width: 180px;
    position: relative;
  }
`;

/*
 * BIM/5D 미적용Fab - tab button, switch style
 * 사용 class: operations, vcsnofM001_tab, vc-switch-field
 */
export const OperationSearchStyle = css`
  .operations,
  .vcsnofM001_tab,
  .tab-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tab {
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid #cfd7df;
    background: #fff;
    color: #26333f;
    cursor: pointer;
  }

  .tab.active {
    border-color: #2f6f73;
    background: #e8f2f2;
    color: #194b50;
    font-weight: 700;
  }

  .vc-switch-field {
    user-select: none;
  }
`;

/*
 * 모든 화면 - form table, small button, grid count/action style
 * 사용 class: formTable, btn_small, search .buttonArea
 */
export const HdCommonStyle = css`
  .formTable {
    width: 100%;
  }

  .full-grid-field {
    grid-column: 1 / -1;
  }

  .btn_small {
    min-width: 54px;
  }

  .search .buttonArea,
  .section-header .buttonArea {
    margin-left: auto;
  }
`;

/*
 * 모든 화면 - signlw 공통 class bridge
 * 사용 class: signlw-pagination, signlw-table, popup-body, graph/group prefix
 */
export const CommonStyle = css`
  .signlw-pagination {
    min-height: 34px;
  }

  .signlw-table {
    border-collapse: collapse;
  }

  .signlw-picker,
  .signlw-text-field-affix-wrapper-sm,
  .signlw-btn {
    font: inherit;
  }

  .signlw-list-bordered-block {
    border: 1px solid #d9dee6;
    background: #fff;
  }

  .popup-body {
    min-width: 0;
  }

  [class^="group-"],
  [class*=" graph"] {
    min-width: 0;
  }
`;

/*
 * BIM/5D 미적용Fab - 메인 화면
 * 연결 class: vcsnof-m001, search_area, vcsnoM001_table, vcsnofM001Style, table-wrap
 */
export const Bim5dMainStyle = styled.main`
  ${SearchStyle}
  ${OperationSearchStyle}
  ${HdCommonStyle}
  ${CommonStyle}

  .vc-pub-section,
  .panel {
    background: #fff;
    border: 1px solid #d9dee6;
  }

  .search-row {
    align-items: flex-end;
  }

  .eq-suggestion-list {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 190px;
    overflow: auto;
    box-shadow: 0 8px 20px rgba(37, 49, 63, 0.16);
  }

  .eq-suggestion-item {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border: 0;
    border-bottom: 1px solid #edf0f4;
    background: #fff;
    color: #26333f;
    text-align: left;
    cursor: pointer;
  }

  .eq-suggestion-item:hover {
    background: #eef6f6;
  }

  .eq-suggestion-item small {
    color: #647281;
  }

  .vcsnoM001_table,
  .table-wrap {
    width: 100%;
  }
`;

/*
 * BIM/5D 미적용Fab - Vacuum Conductance 팝업
 * 연결 class: search_area, signlw-pagination
 */
export const Bim5dVacuumPopupStyle = styled.div`
  ${SearchStyle}
  ${CommonStyle}
`;

/*
 * Spec Master Main/Detail style
 * 연결 class: search_top, search_area, vcsspecM001_table
 */
export const SpecMgmtMainStyle = styled.main`
  ${SearchStyle}
  ${HdCommonStyle}
  ${CommonStyle}

  .search_top,
  .search_area {
    margin-bottom: 12px;
  }

  .vcsspecM001_table {
    width: 100%;
  }
`;

/*
 * Spec Master 신규/수정 팝업
 * 연결 class: popup-body, formTable, btn_small, spec-master-modal
 */
export const SpecMgmtPopupStyle = styled.div`
  ${SearchStyle}
  ${HdCommonStyle}
  ${CommonStyle}

  .modal {
    width: min(900px, 100%);
  }
`;
