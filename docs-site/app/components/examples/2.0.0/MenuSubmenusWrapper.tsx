"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
} from "@/components/menu";

const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export default function MenuSubmenusWrapper() {
  const [compact, setCompact] = useState(false);
  const [sort, setSort] = useState("recent");
  const [lastAction, setLastAction] = useState("—");
  const [lastClose, setLastClose] = useState("—");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Menu
          trigger={<Button variant="outline">Actions</Button>}
          label="Row actions"
          onOpenChange={(open, reason) => {
            if (!open && reason) setLastClose(reason);
          }}
        >
          <MenuItem
            icon={<EditIcon />}
            shortcut="⌘E"
            onSelect={() => setLastAction("Edit")}
          >
            Edit
          </MenuItem>
          <MenuItem onSelect={() => setLastAction("Duplicate")}>
            Duplicate
          </MenuItem>
          <MenuItem disabled onSelect={() => setLastAction("Archive")}>
            Archive
          </MenuItem>
          <MenuSub label="Export">
            <MenuItem onSelect={() => setLastAction("Export CSV")}>
              CSV
            </MenuItem>
            <MenuItem onSelect={() => setLastAction("Export PDF")}>
              PDF
            </MenuItem>
            <MenuSub label="More formats">
              <MenuItem onSelect={() => setLastAction("Export JSON")}>
                JSON
              </MenuItem>
            </MenuSub>
          </MenuSub>
          <MenuSeparator />
          <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>
            Compact rows
          </MenuCheckboxItem>
          <MenuRadioGroup value={sort} onValueChange={setSort} label="Sort by">
            <MenuRadioItem value="recent">Most recent</MenuRadioItem>
            <MenuRadioItem value="name">Name</MenuRadioItem>
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItem destructive onSelect={() => setLastAction("Delete")}>
            Delete
          </MenuItem>
        </Menu>

        <Menu
          trigger={<Button variant="ghost">Aligned to the end</Button>}
          label="Alignment demo"
          align="end"
        >
          <MenuGroup label="Danger zone">
            <MenuItem destructive onSelect={() => setLastAction("Reset")}>
              Reset everything
            </MenuItem>
          </MenuGroup>
        </Menu>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Last action: {lastAction} · closed by: {lastClose}
      </p>
    </div>
  );
}
