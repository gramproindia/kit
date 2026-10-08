"use client";

import { useState } from "react";
import { Input } from "@/components/input";
import { SearchIcon } from "./_fields-fixtures";

export default function InputVariantsWrapper() {
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("ada");
  const taken = ["admin", "root", "support"].includes(username.toLowerCase());

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Search"
        type="search"
        leading={<SearchIcon />}
        clearable
        value={query}
        onValueChange={setQuery}
        placeholder="Orders, customers…"
      />
      <Input
        label="Username"
        value={username}
        onValueChange={setUsername}
        required
        maxLength={20}
        showCount
        error={taken ? `“${username}” is taken` : undefined}
        description="Try “admin” to see the error state."
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Weight"
          type="number"
          trailing="kg"
          size="sm"
          defaultValue="72"
        />
        <Input
          label="Website"
          size="sm"
          leading="https://"
          placeholder="example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Disabled" disabled defaultValue="Can't touch this" />
        <Input label="Read-only" readOnly defaultValue="INV-2026-0042" />
      </div>
    </div>
  );
}
