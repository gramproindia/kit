"use client";
import React, { useState } from "react";
import MaterialInput from "@/legacy-components/materialinput";

export const MaterialInputWrapper = () => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (value: any) => {
    setInputValue(value);

    if (!value.trim()) {
      setError("This field is required.");
    } else {
      setError("");
    }
  };

  return (
    <div className="w-80">
      <MaterialInput
        label="Name"
        type="text"
        value={inputValue}
        onChange={handleChange}
        error={error}
        helperText="Enter your full name."
        required={true}
      />
    </div>
  );
};
