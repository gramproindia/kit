"use client";

import { useEffect, useState } from "react";
import { CircularProgress, Progress } from "@/components/progress";

export default function ProgressVariantsWrapper() {
  const [value, setValue] = useState(18);

  useEffect(() => {
    const timer = setInterval(
      () => setValue((current) => (current >= 100 ? 0 : current + 2)),
      240,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Progress label="Uploading report.pdf" value={value} showValue />
      <Progress
        label="Storage"
        value={92}
        showValue
        valueText="9.2 GB of 10 GB"
        variant="warning"
        size="sm"
      />
      <Progress label="Preparing export" value={null} />
      <div className="flex items-center gap-4">
        <CircularProgress value={value} showValue />
        <CircularProgress
          value={72}
          size={56}
          thickness={6}
          variant="success"
          showValue
        />
        <CircularProgress value={null} size={28} />
      </div>
    </div>
  );
}
