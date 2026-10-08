"use client";

import { useState } from "react";
import { Badge, Tag } from "@/components/badge";

export default function BadgeVariantsWrapper() {
  const [tags, setTags] = useState(["Berlin", "Paris", "Rome"]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Active</Badge>
        <Badge variant="warning" dot>
          Degraded
        </Badge>
        <Badge variant="danger" appearance="solid">
          Failed
        </Badge>
        <Badge variant="accent" appearance="outline">
          Beta
        </Badge>
        <Badge>Draft</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge count={3} variant="danger" appearance="solid" />
        <Badge count={128} variant="danger" appearance="solid" />
        <Badge count={0} showZero />
        <Badge count={0} />
        <span className="text-xs text-zinc-500">
          ← a zero with no showZero renders nothing
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag}
            onRemove={() =>
              setTags((current) => current.filter((item) => item !== tag))
            }
          >
            {tag}
          </Tag>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-zinc-500">All removed.</span>
        )}
      </div>
    </div>
  );
}
