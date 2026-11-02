import { useState } from "react";
import { Text, View } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";
import { SegmentedControl } from "../../source/native/segmented-control";
import { Section } from "./layout";

export function SegmentedControlDemo() {
  const { tokens } = useKitTheme();
  const [period, setPeriod] = useState("week");
  const [days, setDays] = useState<string[]>(["mon", "wed"]);
  const note = { color: tokens.muted, fontSize: tokens.fontSize - 2 };
  return (
    <>
      <Section title="SegmentedControl · thumb (iOS)">
        <SegmentedControl
          aria-label="Period"
          value={period}
          onValueChange={setPeriod}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
          ]}
        />
        <Text style={note}>Value: {period}</Text>
        <View style={{ gap: 10 }}>
          <SegmentedControl
            aria-label="View"
            size="sm"
            fullWidth={false}
            options={[
              { value: "list", label: "List" },
              { value: "grid", label: "Grid" },
              { value: "map", label: "Map", disabled: true },
            ]}
          />
        </View>
      </Section>
      <Section title="SegmentedControl · check (Material 3)">
        <SegmentedControl
          aria-label="Unit"
          indicator="check"
          defaultValue="kg"
          options={[
            { value: "kg", label: "kg" },
            { value: "lb", label: "lb" },
          ]}
        />
        <SegmentedControl
          aria-label="Delivery days"
          multiple
          value={days}
          onValueChange={setDays}
          options={[
            { value: "mon", label: "Mon" },
            { value: "tue", label: "Tue" },
            { value: "wed", label: "Wed" },
            { value: "thu", label: "Thu" },
          ]}
        />
        <Text style={note}>Days: {days.join(", ") || "none"}</Text>
        <SegmentedControl
          aria-label="Disabled"
          disabled
          options={[
            { value: "a", label: "Off" },
            { value: "b", label: "On" },
          ]}
        />
      </Section>
    </>
  );
}
