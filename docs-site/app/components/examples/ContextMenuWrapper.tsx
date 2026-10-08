"use client";

import { ContextMenu } from "@/legacy-components/contextmenu";
import {
  ContextMenuItem,
  ContextMenuDivider,
} from "@/legacy-components/contextmenu/ContextMenuItem";

export const ContextMenuWrapper = () => {
  const handleEdit = () => console.log("Edit clicked");
  const handleDelete = () => console.log("Delete clicked");
  const handleShare = () => console.log("Share clicked");

  return (
    <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white rounded-lg shadow dark:bg-gray-800">
        <p>Right-click anywhere to see the context menu</p>

        <ContextMenu>
          <ContextMenuItem onClick={handleEdit}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={handleDelete} disabled>
            Delete
          </ContextMenuItem>
          <ContextMenuDivider />
          <ContextMenuItem onClick={handleShare}>Share</ContextMenuItem>
        </ContextMenu>
      </div>
    </div>
  );
};
