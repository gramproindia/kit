import { Text, View } from "react-native";
import { Accordion, AccordionItem } from "../../../source/components/accordion";
import { Avatar } from "../../../source/components/avatar";
import { Badge } from "../../../source/components/badge";
import { Breadcrumb } from "../../../source/components/breadcrumb";
import { Button } from "../../../source/components/button";
import { Card, CardBody, CardFooter, CardHeader, Stat } from "../../../source/components/card";
import { dialog } from "../../../source/components/dialog";
import { Popover } from "../../../source/components/popover";
import { toast } from "../../../source/components/toaster";
import { Tooltip } from "../../../source/components/tooltip";
import { useKitTheme } from "../../../source/components/shared/native";
import { BottomSheet } from "../../../source/native/bottom-sheet";
import { List, ListItem } from "../../../source/native/list-item";
import { STATUS_BADGE, formatINR, formatShortDate, useInvoices } from "../data/invoices";
import { router, useLocalSearchParams } from "expo-router";
import { Icon, Muted, Screen } from "../ui/kit";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function InvoiceScreen() {
  const { tokens } = useKitTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { byId, setStatus, remove } = useInvoices();
  const invoice = byId(id);

  if (!invoice) {
    return (
      <Screen title="Invoice">
        <Muted>This invoice was deleted.</Muted>
      </Screen>
    );
  }

  const subtotal = invoice.lines.reduce((sum, l) => sum + l.qty * l.rate, 0);
  const gst = Math.round(subtotal * 0.18);
  const badge = STATUS_BADGE[invoice.status];

  const markPaid = async () => {
    const ok = await dialog.confirm({
      title: `Mark ${invoice.id} as paid?`,
      description: `${formatINR(invoice.amount)} from ${invoice.customer}.`,
      intent: "success",
      confirmLabel: "Mark paid",
      onConfirm: () => wait(700),
    });
    if (!ok) return;
    setStatus(invoice.id, "paid");
    toast.success("Payment recorded", {
      description: `${invoice.id} is paid.`,
      action: { label: "Undo", onClick: () => setStatus(invoice.id, "unpaid") },
    });
  };

  const del = async () => {
    const ok = await dialog.confirm({
      title: `Delete ${invoice.id}?`,
      description: "It moves to the bin for 30 days.",
      intent: "danger",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    router.back();
    setTimeout(() => remove(invoice.id), 250);
    toast("Invoice deleted");
  };

  return (
    <Screen title={invoice.id} subtitle={invoice.customer}>
      <Breadcrumb
        size="sm"
        items={[{ label: "Home", href: "home" }, { label: "Invoices", href: "invoices" }, { label: invoice.id }]}
        onNavigate={() => router.dismissTo("/")}
      />

      <Card variant="elevated">
        <CardHeader
          title={invoice.customer}
          description={`Issued ${formatShortDate(invoice.issued)} · due ${formatShortDate(invoice.due)}`}
          actions={<Badge variant={badge.variant}>{badge.label}</Badge>}
        />
        <CardBody>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={invoice.customer} size="lg" />
            <View style={{ flex: 1 }}>
              <Stat label="Amount due" value={formatINR(invoice.amount)} />
            </View>
            <Popover
              trigger={<Button variant="ghost" icon={<Icon glyph="ⓘ" />} aria-label="About GST" />}
              title="How GST is worked out"
              description="18% on each line, from the item's HSN code and the place of supply."
              side="bottom"
              align="end"
            >
              {`Subtotal ${formatINR(subtotal)} + GST ${formatINR(gst)}.`}
            </Popover>
          </View>
        </CardBody>
        <CardFooter>
          <Tooltip content="Sends an SMS and an email">
            <Button variant="outline" onPress={() => toast.info("Reminder sent", { description: invoice.customer })}>
              Remind
            </Button>
          </Tooltip>
          <Button onPress={markPaid} disabled={invoice.status === "paid"}>
            {invoice.status === "paid" ? "Paid" : "Mark paid"}
          </Button>
        </CardFooter>
      </Card>

      <Accordion variant="contained" multiple defaultValue={["lines"]}>
        <AccordionItem value="lines" title="Line items" meta={<Badge>{invoice.lines.length}</Badge>}>
          <View style={{ gap: 8 }}>
            {invoice.lines.map((line) => (
              <View key={line.item} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: tokens.fg, fontSize: tokens.fontSize, flex: 1 }}>
                  {line.item} × {line.qty}
                </Text>
                <Text style={{ color: tokens.fg, fontSize: tokens.fontSize }}>{formatINR(line.qty * line.rate)}</Text>
              </View>
            ))}
            <Muted>{`GST 18%: ${formatINR(gst)}`}</Muted>
          </View>
        </AccordionItem>
        <AccordionItem value="history" title="History" description="3 events">
          {`Created ${formatShortDate(invoice.issued)}\nSent by email ${formatShortDate(invoice.issued)}\nViewed by ${invoice.customer.split(" ")[0]}`}
        </AccordionItem>
        <AccordionItem value="notes" title="Notes">
          {invoice.notes || "No notes."}
        </AccordionItem>
      </Accordion>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <BottomSheet
          trigger={<Button variant="secondary">Share</Button>}
          title={`Share ${invoice.id}`}
          description="Pick how to send it."
        >
          {(close) => (
            <List style={{ marginHorizontal: -16 }}>
              {[
                ["⧉", "Copy link"],
                ["✆", "WhatsApp"],
                ["✉", "Email"],
                ["⤓", "Download PDF"],
              ].map(([glyph, label]) => (
                <ListItem
                  key={label}
                  leading={<Icon glyph={glyph} />}
                  title={label}
                  onPress={() => {
                    close();
                    toast.success(`${label}: done`);
                  }}
                />
              ))}
            </List>
          )}
        </BottomSheet>
        <Button variant="danger" onPress={del}>
          Delete
        </Button>
      </View>
    </Screen>
  );
}
