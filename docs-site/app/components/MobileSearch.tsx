"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import DocSearch from "./searchBox";
import { createPortal } from "react-dom";

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearch({ isOpen, onClose }: MobileSearchProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Search Docs
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
          aria-label="Close search"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <DocSearch
          autoFocus={true}
          onNavigate={() => onClose()}
          className="w-full"
        />
      </div>
    </div>,
    document.body
  );
}
