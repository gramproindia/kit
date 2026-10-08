"use client";

import { Avatar, AvatarGroup } from "@/components/avatar";
import { PEOPLE } from "./_display-fixtures";

export default function AvatarVariantsWrapper() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {PEOPLE.slice(0, 4).map((name) => (
          <Avatar key={name} name={name} />
        ))}
        <Avatar
          name="Ada Lovelace"
          src="https://example.invalid/missing.png"
        />
        <span className="text-xs text-zinc-500">
          ← a broken image falls back to initials
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name="Ada Lovelace" size="xs" />
        <Avatar name="Grace Hopper" size="sm" status="online" />
        <Avatar name="Alan Turing" status="busy" />
        <Avatar
          name="Katherine Johnson"
          size="lg"
          shape="square"
          status="away"
        />
        <Avatar name="Edsger Dijkstra" size="xl" />
      </div>
      <AvatarGroup label="Assigned to" max={4}>
        {PEOPLE.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
    </div>
  );
}
