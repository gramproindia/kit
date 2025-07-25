"use client";

import { GridMemoised as GridComponent } from "./layout";
import { memo } from "react";

const DataGrid = memo(GridComponent, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.dataSource === nextProps.dataSource &&
    prevProps.columns === nextProps.columns &&
    prevProps.pageSettings.pageNumber === nextProps.pageSettings.pageNumber &&
    prevProps.enableSearch === nextProps.enableSearch &&
    prevProps.enablePdfExport === nextProps.enablePdfExport &&
    prevProps.enableExcelExport === nextProps.enableExcelExport
  );
});

export { DataGrid };
