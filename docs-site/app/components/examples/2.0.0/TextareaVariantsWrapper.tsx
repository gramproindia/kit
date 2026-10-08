"use client";

import { useState } from "react";
import { Textarea } from "@/components/textarea";

export default function TextareaVariantsWrapper() {
  const [bio, setBio] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label="Bio"
        value={bio}
        onValueChange={setBio}
        autoResize
        minRows={2}
        maxRows={6}
        maxLength={160}
        showCount
        placeholder="Grows as you type 👍🏽"
      />
      <Textarea
        label="Internal notes"
        rows={4}
        resize="both"
        description="Drag the corner to resize."
      />
      <Textarea
        label="Error state"
        defaultValue="Too short"
        error="Write at least 20 characters."
        size="sm"
      />
    </div>
  );
}
