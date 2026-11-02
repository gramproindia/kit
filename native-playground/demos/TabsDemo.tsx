import { useState } from "react";
import { Text } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";
import { Tab, TabList, TabPanel, Tabs } from "../../source/components/tabs";
import { Section } from "./layout";

function Body({ children }: { children: string }) {
  const { tokens } = useKitTheme();
  return <Text style={{ color: tokens.fg, fontSize: tokens.fontSize, paddingVertical: 8 }}>{children}</Text>;
}

export function TabsDemo() {
  const [value, setValue] = useState("invoices");
  return (
    <>
      <Section title="Tabs · line (scrolls when it does not fit)">
        <Tabs value={value} onValueChange={setValue}>
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="invoices" badge={12}>
              Invoices
            </Tab>
            <Tab value="payments">Payments</Tab>
            <Tab value="reports">Reports</Tab>
            <Tab value="settings">Settings</Tab>
            <Tab value="archived" disabled>
              Archived
            </Tab>
          </TabList>
          <TabPanel value="overview">
            <Body>Overview: revenue and outstanding at a glance.</Body>
          </TabPanel>
          <TabPanel value="invoices">
            <Body>12 invoices waiting for approval.</Body>
          </TabPanel>
          <TabPanel value="payments">
            <Body>Payments received this month.</Body>
          </TabPanel>
          <TabPanel value="reports">
            <Body>Reports: GST, TDS and ledgers.</Body>
          </TabPanel>
          <TabPanel value="settings">
            <Body>Settings for this workspace.</Body>
          </TabPanel>
        </Tabs>
      </Section>

      <Section title="Tabs · pills, small">
        <Tabs variant="pills" size="sm" defaultValue="week">
          <TabList>
            <Tab value="day">Day</Tab>
            <Tab value="week">Week</Tab>
            <Tab value="month">Month</Tab>
            <Tab value="year">Year</Tab>
          </TabList>
          <TabPanel value="day">
            <Body>Today's numbers.</Body>
          </TabPanel>
          <TabPanel value="week">
            <Body>This week's numbers.</Body>
          </TabPanel>
          <TabPanel value="month">
            <Body>This month's numbers.</Body>
          </TabPanel>
          <TabPanel value="year">
            <Body>This year's numbers.</Body>
          </TabPanel>
        </Tabs>
      </Section>

      <Section title="Tabs · enclosed (segmented), keepMounted">
        <Tabs variant="enclosed" keepMounted>
          <TabList>
            <Tab value="list">List</Tab>
            <Tab value="board">Board</Tab>
            <Tab value="calendar">Calendar</Tab>
          </TabList>
          <TabPanel value="list">
            <Body>No value given: the first tab is selected.</Body>
          </TabPanel>
          <TabPanel value="board">
            <Body>Board view; the list keeps its state while hidden.</Body>
          </TabPanel>
          <TabPanel value="calendar">
            <Body>Calendar view.</Body>
          </TabPanel>
        </Tabs>
      </Section>

      <Section title="Tabs · vertical">
        <Tabs orientation="vertical" defaultValue="profile">
          <TabList>
            <Tab value="profile">Profile</Tab>
            <Tab value="security">Security</Tab>
            <Tab value="billing">Billing</Tab>
          </TabList>
          <TabPanel value="profile">
            <Body>Name, photo and contact details.</Body>
          </TabPanel>
          <TabPanel value="security">
            <Body>Password and two-factor sign-in.</Body>
          </TabPanel>
          <TabPanel value="billing">
            <Body>Plan and payment method.</Body>
          </TabPanel>
        </Tabs>
      </Section>
    </>
  );
}
