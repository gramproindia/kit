"use client";

import { useState, type CSSProperties } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@/components/tabs";

/*
 * Longhands only: `on` changes borderColor and fontWeight, and React warns when
 * a longhand is dropped on re-render while a matching shorthand (border, font)
 * is still set.
 */
const toggle: CSSProperties = {
  padding: "4px 10px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgb(128 128 128 / 0.4)",
  borderRadius: 999,
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 400,
  cursor: "pointer",
};

const on: CSSProperties = { ...toggle, borderColor: "currentColor", fontWeight: 600 };

type Variant = "line" | "pills" | "enclosed";
const VARIANTS: Variant[] = ["line", "pills", "enclosed"];

/** Live example used in the Tabs documentation. */
export function TabsWrapper() {
  const [tab, setTab] = useState("overview");
  const [variant, setVariant] = useState<Variant>("line");
  const [vertical, setVertical] = useState(false);
  const [manual, setManual] = useState(false);
  const [notes, setNotes] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
      {/* Not part of the component: switches the props below, to show each look. */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, fontSize: 12 }}>
        {VARIANTS.map((option) => (
          <button
            key={option}
            type="button"
            style={variant === option ? on : toggle}
            aria-pressed={variant === option}
            onClick={() => setVariant(option)}
          >
            {option}
          </button>
        ))}
        <button type="button" style={vertical ? on : toggle} aria-pressed={vertical} onClick={() => setVertical((v) => !v)}>
          vertical
        </button>
        <button type="button" style={manual ? on : toggle} aria-pressed={manual} onClick={() => setManual((v) => !v)}>
          manual activation
        </button>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        variant={variant}
        orientation={vertical ? "vertical" : "horizontal"}
        activation={manual ? "manual" : "automatic"}
        keepMounted
      >
        <TabList aria-label="Project">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity" badge={3}>
            Activity
          </Tab>
          <Tab value="notes">Notes</Tab>
          <Tab value="archive" disabled>
            Archive
          </Tab>
        </TabList>
        <TabPanel value="overview">
          Focus a tab and use the arrow keys. With <code>manual activation</code> the arrows only move focus, and Enter
          or Space selects.
        </TabPanel>
        <TabPanel value="activity">3 new comments since your last visit.</TabPanel>
        <TabPanel value="notes">
          {/* keepMounted: what you type here survives switching tabs. */}
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            Type something, switch tabs and come back — <code>keepMounted</code> keeps it.
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="A note"
              style={{
                padding: "6px 8px",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgb(128 128 128 / 0.4)",
                borderRadius: 6,
                background: "transparent",
                color: "inherit",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            />
          </label>
        </TabPanel>
      </Tabs>

      <code style={{ fontSize: 12, opacity: 0.7 }}>
        value: {JSON.stringify(tab)} · variant: {JSON.stringify(variant)} · orientation:{" "}
        {JSON.stringify(vertical ? "vertical" : "horizontal")}
      </code>
    </div>
  );
}

export default TabsWrapper;
