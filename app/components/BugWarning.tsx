import React from "react";
import { Info } from "lucide-react";

type BugWarningProps = {
  message?: string;
};

export default function BugWarning({ message }: BugWarningProps) {
  return (
    <div className="w-full bg- bg-red-700 mt-2 p-2 rounded-xl border border-gray-100/45 text-xs">
      <div className="text-md flex items-center gap-1 font-semibold mb-1">
        <Info size={16} /> Warning
      </div>
      <div className="ml-5">{message || "BugWarning"}</div>
    </div>
  );
}
