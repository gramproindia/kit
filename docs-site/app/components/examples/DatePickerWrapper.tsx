"use client";

import React, { useState } from "react";
import { DatePicker } from "@/legacy-components/datepicker";

export const DatePickerWrapper = () => {
  return (
    <div className="app-container w-96">
      <DatePicker placeholder="Select a date" />
    </div>
  );
};
