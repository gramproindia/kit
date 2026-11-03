import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { Avatar } from "../../../../source/components/avatar";
import { Button } from "../../../../source/components/button";
import { dialog } from "../../../../source/components/dialog";
import { useKitTheme } from "../../../../source/components/shared/native";
import { toast } from "../../../../source/components/toaster";
import { AppBar } from "../../../../source/native/app-bar";
import { List, ListItem } from "../../../../source/native/list-item";
import { formatINR, useInvoices } from "../../data/invoices";

/** Kit components inside a native-tabs screen. */
export default function Inbox() {
  const { tokens } = useKitTheme();
  const { invoices } = useInvoices();
  const remind = async () => {
    const ok = await dialog.confirm({
      title: "Send reminders?",
      description: "Every unpaid and overdue invoice gets a reminder. (A demo: nothing is sent.)",
      confirmLabel: "Send",
    });
    if (ok) toast.success("Reminders sent");
  };
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <AppBar variant="large" title="Inbox" subtitle="Native tabs" onBack={() => router.back()} />
      {/* iOS lets content run under the glass tab bar; automatic insets keep the last row clear. */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ padding: 16 }}>
          <Button fullWidth onPress={remind}>
            Send payment reminders
          </Button>
        </View>
        <List>
          {invoices
            .filter((i) => i.status === "unpaid" || i.status === "overdue")
            .map((invoice) => (
              <ListItem
                key={invoice.id}
                leading={<Avatar name={invoice.customer} size="sm" />}
                title={invoice.customer}
                description={`${invoice.id} · ${formatINR(invoice.amount)} · ${invoice.status}`}
              />
            ))}
        </List>
      </ScrollView>
    </View>
  );
}
