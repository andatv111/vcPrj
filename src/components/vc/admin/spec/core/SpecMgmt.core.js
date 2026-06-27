export const MASTER_COLUMNS = [
  { key: "select", label: "" },
  { key: "no", label: "No" },
  { key: "fabId", label: "FAB" },
  { key: "setModelNm", label: "Model" },
  { key: "specNm", label: "SPEC NAME" },
  { key: "specMinVal", label: "V/C Min" },
  { key: "specMaxVal", label: "V/C Max" },
  { key: "chgrNm", label: "담당자" },
  { key: "detSearYn", label: "상세스펙" },
];

export const DETAIL_COLUMNS = [
  { key: "select", label: "" },
  { key: "no", label: "No" },
  { key: "fabId", label: "FAB" },
  { key: "setModelNm", label: "Model" },
  { key: "specNm", label: "SPEC NAME" },
  { key: "operLargeCatgVal", label: "공정대분류" },
  { key: "operMidCatgVal", label: "공정중분류" },
  { key: "chambModelNm", label: "CHAMBER SPEC" },
  { key: "specMinVal", label: "V/C Min" },
  { key: "specMaxVal", label: "V/C Max" },
  { key: "chgrNm", label: "담당자" },
];

export const MASTER_PAGE_SIZE = 10;
export const DETAIL_PAGE_SIZE = 10;

export const FILTERABLE_MASTER_COLUMNS = MASTER_COLUMNS.filter((column) => !["select", "no"].includes(column.key));
export const FILTERABLE_DETAIL_COLUMNS = DETAIL_COLUMNS.filter((column) => !["select", "no"].includes(column.key));

export const toDisplayText = (value) => (value === undefined || value === null || value === "" ? "-" : String(value));
export const getBooleanYn = (value) => (value === "Y" || value === true ? "Y" : "N");

export const createEmptyFilters = (columns) =>
  columns.reduce((acc, column) => {
    acc[column.key] = "";
    return acc;
  }, {});

const getFilterText = (row, key) => {
  const value = key === "detSearYn" ? getBooleanYn(row[key]) : row[key];
  return value === undefined || value === null ? "" : String(value).toLowerCase();
};

export const filterRows = (rows, filters, columns) =>
  rows.filter((row) =>
    columns.every((column) => {
      const filterValue = String(filters[column.key] || "").trim().toLowerCase();
      if (!filterValue) return true;
      return getFilterText(row, column.key).includes(filterValue);
    })
  );

export const paginateRows = (rows, page, size) => rows.slice(page * size, page * size + size);
export const getTotalPages = (count, size) => Math.max(1, Math.ceil(count / size));
export const getPagedRowNumber = (page, size, index) => page * size + index + 1;
export const getPageForRow = (rows, specId, size) => {
  const index = rows.findIndex((row) => row.specId === specId);
  return index < 0 ? -1 : Math.floor(index / size);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const createExcelTable = (title, headers, rows) => `
  <h3>${escapeHtml(title)}</h3>
  <table border="1">
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
`;

export const downloadSpecMgmtExcel = ({ selectedMaster, detailRows }) => {
  const masterRows = selectedMaster
    ? [[
        selectedMaster.fabId,
        selectedMaster.setModelNm,
        selectedMaster.specNm,
        selectedMaster.specMinVal,
        selectedMaster.specMaxVal,
        selectedMaster.chgrNm,
        getBooleanYn(selectedMaster.detSearYn),
      ]]
    : [];
  const detailExcelRows = detailRows.map((row, index) => [
    index + 1,
    row.fabId,
    row.setModelNm,
    row.specNm,
    row.operLargeCatgVal,
    row.operMidCatgVal,
    row.chambModelNm,
    row.specMinVal,
    row.specMaxVal,
    row.chgrNm,
  ]);
  const html = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        ${createExcelTable("MASTER", ["FAB", "Model", "SPEC NAME", "V/C Min", "V/C Max", "담당자", "상세스펙"], masterRows)}
        <br />
        ${createExcelTable("DETAIL", ["No", "FAB", "Model", "SPEC NAME", "공정대분류", "공정중분류", "CHAMBER SPEC", "V/C Min", "V/C Max", "담당자"], detailExcelRows)}
      </body>
    </html>
  `;

  const blob = new Blob([`\uFEFF${html}`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "spec_master.xls";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
