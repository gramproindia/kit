import { useMemo, useState } from "react";
import { Text } from "react-native";
import { MultiSelect, Select, type ComboboxOption } from "../../source/components/combobox";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

const STATES: ComboboxOption[] = [
  ["KL", "Kerala", "South"],
  ["TN", "Tamil Nadu", "South"],
  ["KA", "Karnataka", "South"],
  ["AP", "Andhra Pradesh", "South"],
  ["TG", "Telangana", "South"],
  ["MH", "Maharashtra", "West"],
  ["GJ", "Gujarat", "West"],
  ["GA", "Goa", "West"],
  ["RJ", "Rajasthan", "North"],
  ["PB", "Punjab", "North"],
  ["UP", "Uttar Pradesh", "North"],
  ["DL", "Delhi", "North"],
  ["WB", "West Bengal", "East"],
  ["OD", "Odisha", "East"],
  ["AS", "Assam", "North-east"],
  ["MN", "Manipur", "North-east"],
].map(([value, label, group]) => ({ value, label, group, keywords: [value] }));

const SKILLS: ComboboxOption[] = [
  "React", "React Native", "TypeScript", "Node.js", "GraphQL", "PostgreSQL", "Figma", "Kotlin", "Swift", "Go",
].map((label) => ({ value: label.toLowerCase(), label }));

export function ComboboxDemo() {
  const { tokens } = useKitTheme();
  const [state, setState] = useState<string | null>("KL");
  const [skills, setSkills] = useState<string[]>(["react", "typescript"]);
  const [extra, setExtra] = useState<ComboboxOption[]>([]);
  const [account, setAccount] = useState<string | null>(null);

  const many = useMemo<ComboboxOption[]>(
    () =>
      Array.from({ length: 500 }, (_, i) => ({
        value: `acc-${i + 1}`,
        label: `Account ${String(i + 1).padStart(3, "0")}`,
        description: i % 7 === 0 ? "Dormant since 2024" : `Ledger ${(i % 12) + 1}`,
        disabled: i % 41 === 40,
      })),
    [],
  );

  return (
    <>
      <Section title="Select · grouped, searchable">
        <Select
          label="State"
          options={STATES}
          value={state}
          onChange={(value) => setState(value)}
          description="Search by name or code (e.g. “KL”)."
        />
        <Text style={{ color: tokens.muted }}>Value: {String(state)}</Text>
      </Section>

      <Section title="MultiSelect · tags, max, create">
        <MultiSelect
          label="Skills"
          options={[...SKILLS, ...extra]}
          value={skills}
          onChange={setSkills}
          max={5}
          maxVisibleTags={3}
          allowCreate
          onCreate={(label) => {
            const option = { value: label.toLowerCase(), label };
            setExtra((list) => [...list, option]);
            setSkills((list) => (list.length < 5 ? [...list, option.value] : list));
          }}
        />
      </Section>

      <Section title="Select · 500 options, virtualised">
        <Select
          label="Ledger account"
          options={many}
          value={account}
          onChange={setAccount}
          placeholder="Pick an account"
        />
      </Section>

      <Section title="Select · error and disabled">
        <Select label="Branch" options={STATES} required error="Choose a branch to continue." />
        <Select label="Region" options={STATES} defaultValue="TN" disabled />
        <MultiSelect label="Tags" options={SKILLS} searchable={false} size="sm" placeholder="No search box" />
      </Section>
    </>
  );
}
