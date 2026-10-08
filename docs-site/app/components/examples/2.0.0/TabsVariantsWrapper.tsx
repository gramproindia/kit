"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Tab, TabList, TabPanel, Tabs } from "@/components/tabs";

export default function TabsVariantsWrapper() {
  const [variant, setVariant] = useState<"line" | "pills" | "enclosed">("line");

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="overview" variant={variant} keepMounted>
        <TabList aria-label="Project">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity" badge={12}>
            Activity
          </Tab>
          <Tab value="settings">Settings</Tab>
          <Tab value="billing" disabled>
            Billing
          </Tab>
        </TabList>
        <TabPanel value="overview" className="text-sm">
          <p>Switch the look:</p>
          <div className="mt-2 flex gap-2">
            {(["line", "pills", "enclosed"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={option === variant ? "primary" : "outline"}
                onClick={() => setVariant(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </TabPanel>
        <TabPanel value="activity" className="text-sm">
          12 new events since yesterday.
        </TabPanel>
        <TabPanel value="settings" className="text-sm">
          <label className="flex flex-col gap-1">
            Project name
            <input
              className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
              defaultValue="Atlas"
            />
          </label>
        </TabPanel>
      </Tabs>

      <Tabs
        defaultValue="general"
        orientation="vertical"
        variant="pills"
        activation="manual"
        size="sm"
      >
        <TabList aria-label="Account settings">
          <Tab value="general">General</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="notifications">Notifications</Tab>
        </TabList>
        <TabPanel value="general" className="text-sm">
          Vertical, manual activation: arrows move focus, Enter selects.
        </TabPanel>
        <TabPanel value="security" className="text-sm">
          Two-factor authentication is on.
        </TabPanel>
        <TabPanel value="notifications" className="text-sm">
          Email digests are weekly.
        </TabPanel>
      </Tabs>
    </div>
  );
}
