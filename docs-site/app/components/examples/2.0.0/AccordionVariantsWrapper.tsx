"use client";

import { Accordion, AccordionItem } from "@/components/accordion";
import { Badge } from "@/components/badge";

export default function AccordionVariantsWrapper() {
  return (
    <div className="flex flex-col gap-4">
      <Accordion
        defaultValue={["shipping"]}
        items={[
          {
            value: "shipping",
            title: "Shipping",
            content: <p>Two to five working days.</p>,
          },
          {
            value: "returns",
            title: "Returns",
            description: "Thirty days",
            content: <p>No questions asked.</p>,
          },
          {
            value: "support",
            title: "Support",
            content: <p>We answer within a day.</p>,
            disabled: true,
          },
        ]}
      />
      <Accordion multiple variant="contained" size="sm" iconPosition="start">
        <AccordionItem value="a" title="Filters" meta={<Badge count={3} />}>
          <p>Several can be open at once here.</p>
        </AccordionItem>
        <AccordionItem value="b" title="Columns">
          <p>And closing them all is allowed.</p>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
