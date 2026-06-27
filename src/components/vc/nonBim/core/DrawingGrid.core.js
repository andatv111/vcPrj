export const DRAWING_PAGE_SIZE = 4;

export const FILTERABLE_DRAWING_KEYS = [
  "woId",
  "eqId",
  "siteNm",
  "fabCd",
  "area",
  "areaDetail",
  "chgType1Nm",
  "catNm",
  "requestStatus",
  "fileNm",
  "crteDt",
  "crteIdNm",
];

export const createDrawingFilters = () =>
  FILTERABLE_DRAWING_KEYS.reduce((filters, key) => {
    filters[key] = "";
    return filters;
  }, {});

export const filterDrawings = (drawings = [], filters = {}) =>
  drawings.filter((drawing) =>
    FILTERABLE_DRAWING_KEYS.every((key) => {
      const keyword = String(filters[key] || "").trim().toLowerCase();
      if (!keyword) return true;
      return String(drawing[key] ?? "").toLowerCase().includes(keyword);
    })
  );

export const paginateDrawings = (drawings, page, pageSize = DRAWING_PAGE_SIZE) =>
  drawings.slice(page * pageSize, page * pageSize + pageSize);

export const getDrawingTotalPages = (count, pageSize = DRAWING_PAGE_SIZE) =>
  Math.max(1, Math.ceil(count / pageSize));

export const getDrawingPage = (drawings, woId, pageSize = DRAWING_PAGE_SIZE) => {
  const index = drawings.findIndex((drawing) => drawing.woId === woId);
  return index < 0 ? -1 : Math.floor(index / pageSize);
};

export const getDrawingRowNumber = (page, index, pageSize = DRAWING_PAGE_SIZE) =>
  page * pageSize + index + 1;
