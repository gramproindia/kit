import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../source/components/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
} from "../../source/components/menu";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

export function MenuDemo() {
  const { tokens } = useKitTheme();
  const [last, setLast] = useState("—");
  const [wrap, setWrap] = useState(true);
  const [density, setDensity] = useState("comfortable");

  const items = (
    <>
      <MenuGroup label="Invoice">
        <MenuItem onSelect={() => setLast("Edit")} shortcut="⌘E">
          Edit
        </MenuItem>
        <MenuItem onSelect={() => setLast("Duplicate")}>Duplicate</MenuItem>
        <MenuSub label="Export as">
          <MenuItem onSelect={() => setLast("PDF")}>PDF</MenuItem>
          <MenuItem onSelect={() => setLast("CSV")}>CSV</MenuItem>
          <MenuSub label="Spreadsheet">
            <MenuItem onSelect={() => setLast("XLSX")}>Excel (.xlsx)</MenuItem>
            <MenuItem disabled>Google Sheets</MenuItem>
          </MenuSub>
        </MenuSub>
        <MenuItem disabled>Send reminder</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuCheckboxItem checked={wrap} onCheckedChange={setWrap}>
        Wrap long lines
      </MenuCheckboxItem>
      <MenuRadioGroup label="Density" value={density} onValueChange={setDensity}>
        <MenuRadioItem value="compact">Compact</MenuRadioItem>
        <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuItem destructive onSelect={() => setLast("Delete")}>
        Delete invoice
      </MenuItem>
    </>
  );

  return (
    <Section title="Menu · items, groups, submenus">
      <Row>
        <Menu trigger={<Button variant="outline">Actions (auto)</Button>} label="Invoice actions">
          {items}
        </Menu>
        <Menu trigger={<Button variant="outline">As popover</Button>} presentation="popover">
          {items}
        </Menu>
      </Row>
      <Text style={{ color: tokens.muted }}>
        Last: {last} · wrap {wrap ? "on" : "off"} · {density}
      </Text>
    </Section>
  );
}
