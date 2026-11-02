import { useState } from "react";
import { Text } from "react-native";
import { Accordion, AccordionItem } from "../../source/components/accordion";
import { Badge } from "../../source/components/badge";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

const FAQ = [
  {
    value: "gst",
    title: "Do invoices include GST?",
    content: "Yes. GST is worked out per line from the item's HSN code and the place of supply.",
  },
  {
    value: "export",
    title: "Can I export to Tally?",
    description: "XML and Excel",
    content: "Export a period as Tally XML or as an Excel workbook from the Reports tab.",
  },
  {
    value: "users",
    title: "How many people can use one workspace?",
    content: "Up to 25 on the Pro plan. Each person gets their own sign-in and role.",
  },
  {
    value: "legacy",
    title: "Legacy import (retired)",
    content: "No longer available.",
    disabled: true,
  },
];

export function AccordionDemo() {
  const { tokens } = useKitTheme();
  const [open, setOpen] = useState<string[]>(["export"]);
  return (
    <>
      <Section title="Accordion · separated (items prop)">
        <Accordion items={FAQ} value={open} onValueChange={setOpen} />
        <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>
          Open: {open.length ? open.join(", ") : "none"}
        </Text>
      </Section>

      <Section title="Accordion · contained, multiple">
        <Accordion variant="contained" multiple defaultValue={["a"]}>
          <AccordionItem value="a" title="Billing address" meta={<Badge>Required</Badge>}>
            12 MG Road, Kochi, Kerala 682016
          </AccordionItem>
          <AccordionItem value="b" title="Shipping address" description="Same as billing">
            Ships to the billing address unless you add another.
          </AccordionItem>
          <AccordionItem value="c" title="Notes">
            Deliver between 10 am and 5 pm.
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Accordion · plain, chevron at start, not collapsible">
        <Accordion variant="plain" iconPosition="start" collapsible={false} defaultValue={["one"]} size="sm">
          <AccordionItem value="one" title="Step 1 · Company">
            Legal name, GSTIN and PAN.
          </AccordionItem>
          <AccordionItem value="two" title="Step 2 · Bank">
            Account number and IFSC.
          </AccordionItem>
          <AccordionItem value="three" title="Step 3 · Review">
            Check everything before submitting.
          </AccordionItem>
        </Accordion>
      </Section>
    </>
  );
}
