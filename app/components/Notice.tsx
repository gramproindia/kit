import { Info, Link2 } from "lucide-react";
import Link from "next/link";
import React from "react";

interface NoticeProps {
  message?: string;
  link?: string;
}

export default function Notice({ message, link }: NoticeProps) {
  return (
    <div className="w-full p-4 bg-zinc-800 text-white rounded-xl text-sm flex items-center space-x-2">
      <Info className="inline-block mr-2 text-yellow-400" />
      {message}
      {link && (
        <Link
          href={link}
          className="text-blue-400 hover:underline pl-2 flex items-center gap-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Link2 className="w-4 h-4" />
          Click Here
        </Link>
      )}
    </div>
  );
}
