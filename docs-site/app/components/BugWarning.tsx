import React from "react";
import { Info } from "lucide-react";
import Link from "next/link";

type BugWarningProps = {
  message?: string;
  url?: string;
};

export default function BugWarning({ message, url }: BugWarningProps) {
  return (
    <div className="w-full mt-2 p-2 rounded-xl border border-red-700/45 text-xs text-red-700">
      <div className="text-md md:text-xl flex items-center gap-1 font-semibold mb-1">
        <Info size={16} /> Warning
      </div>
      <div className="ml-5 md:text-sm">{message || "BugWarning"}</div>
      {url && (
        <Link
          href={url}
          className="ml-5 text-blue-500 hover:underline md:text-sm mt-2"
        >
          Learn more
        </Link>
      )}
    </div>
  );
}
