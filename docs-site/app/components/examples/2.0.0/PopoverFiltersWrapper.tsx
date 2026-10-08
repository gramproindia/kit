"use client";

import { Button } from "@/components/button";
import { Popover } from "@/components/popover";
import { Tooltip } from "@/components/tooltip";

export default function PopoverFiltersWrapper() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip content="Export as CSV">
        <Button variant="outline">Hover or focus me</Button>
      </Tooltip>
      <Tooltip content="On the right" side="right">
        <Button variant="ghost">Right side</Button>
      </Tooltip>

      <Popover trigger={<Button variant="outline">Filters</Button>} title="Filters">
        {({ close }) => (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" /> Only active
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" /> Has attachments
            </label>
            <Button size="sm" onClick={close} data-autofocus>
              Apply
            </Button>
          </div>
        )}
      </Popover>
    </div>
  );
}
