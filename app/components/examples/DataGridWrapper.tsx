"use client";

import React from "react";
import { DataGrid } from "@/component-lib/datagrid";

const DataGridWrapper = () => {
  const data = [
    { id: 1, name: "John Doe", age: 28 },
    { id: 2, name: "Jane Smith", age: 32 },
  ];

  const columns = [
    { field: "id", headerText: "ID", width: 50 },
    { field: "name", headerText: "Name", width: 150, tooltip: true },
    { field: "age", headerText: "Age", width: 50, filter: true },
  ];

  return (
    <DataGrid
      dataSource={data}
      columns={columns}
      pageSettings={{ pageNumber: 10 }}
      enableSearch={true}
      enableExcelExport={true}
      excelName="User_Data"
      enablePdfExport={true}
      pdfName="User_Data"
      onSelectRow={(selectedRows) => {
        console.log("Selected Rows:", selectedRows);
      }}
    />
  );
};

export default DataGridWrapper;
