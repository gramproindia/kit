"use client";

import React from "react";
import { BarChart } from "@/component-lib/bargraph";

const data = [
  { label: "Jan", value: 40 },
  { label: "Feb", value: 55 },
  { label: "Mar", value: 75 },
  { label: "Apr", value: 20 },
  { label: "May", value: 90 },
];

export const BarGraphWrapper = () => {
  return (
    <BarChart
      data={data}
      height={300}
      title="Monthly Sales"
      showXValue={true}
    />
  );
};
