import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Alert } from "../../../source/components/alert";
import { Avatar } from "../../../source/components/avatar";
import { Badge } from "../../../source/components/badge";
import { Button } from "../../../source/components/button";
import { Card, CardBody, Stat, trendDirection } from "../../../source/components/card";
import { Menu, MenuItem, MenuSeparator } from "../../../source/components/menu";
import { Progress } from "../../../source/components/progress";
import { Skeleton } from "../../../source/components/skeleton";
import { Tab, TabList, Tabs } from "../../../source/components/tabs";
import { toast } from "../../../source/components/toaster";
import { useKitTheme } from "../../../source/components/shared/native";
import { Fab } from "../../../source/native/fab";
import { List, ListItem } from "../../../source/native/list-item";
import { SearchBar } from "../../../source/native/search-bar";
import { SegmentedControl } from "../../../source/native/segmented-control";
import { STATUS_BADGE, formatINR, formatShortDate, useInvoices } from "../data/invoices";
import { useNav } from "../navigation/Navigator";
import { BarAction, Heading, Icon, Muted, Screen } from "../ui/kit";

type Period = "week" | "month" | "quarter";
type Filter = "all" | "unpaid" | "paid";

const PERIOD_NUMBERS: Record<Period, { revenue: number; trend: number; collected: number; target: number; customers: number }> = {
  week: { revenue: 182_500, trend: 6.2, collected: 128_000, target: 200_000, customers: 14 },
  month: { revenue: 1_240_000, trend: 12.4, collected: 910_000, target: 1_500_000, customers: 58 },
  quarter: { revenue: 3_480_000, trend: -3.1, collected: 2_950_000, target: 4_000_000, customers: 131 },
};

export function HomeScreen() {
  const { tokens } = useKitTheme();
  const nav = useNav();
  const { invoices } = useInvoices();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [filter, setFilter] = useState<Filter>("all");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [extended, setExtended] = useState(true);

  // A first load, so the skeletons have something to stand in for.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const numbers = PERIOD_NUMBERS[period];
  const overdue = invoices.filter((i) => i.status === "overdue");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (filter === "paid" && invoice.status !== "paid") return false;
      if (filter === "unpaid" && invoice.status === "paid") return false;
      return !q || invoice.customer.toLowerCase().includes(q) || invoice.id.toLowerCase().includes(q);
    });
  }, [invoices, filter, query]);

  return (
    <Screen
      variant="large"
      title="Grampro Books"
      subtitle={searching ? undefined : "Kochi branch"}
      actions={[
        <BarAction key="search" glyph="⌕" label="Search invoices" onPress={() => setSearching((s) => !s)} />,
        <Menu
          key="more"
          label="More"
          trigger={<Button variant="ghost" icon={<Icon glyph="⋮" size={22} />} aria-label="More options" />}
        >
          <MenuItem onSelect={() => toast.success("Exported invoices.xlsx")}>Export to Excel</MenuItem>
          <MenuItem
            onSelect={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 800);
            }}
          >
            Refresh
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => nav.setTab("settings")}>Settings</MenuItem>
        </Menu>,
      ]}
      header={
        searching ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <SearchBar
              autoFocus
              showCancel
              onCancel={() => {
                setSearching(false);
                setQuery("");
              }}
              onSearch={setQuery}
              localeText={{ placeholder: "Customer or invoice number" }}
            />
          </View>
        ) : null
      }
      scrollProps={{ onScroll: (e) => setExtended(e.nativeEvent.contentOffset.y < 40) }}
      overlay={
        <Fab
          safeArea={false}
          offset={16}
          label="New invoice"
          extended={extended}
          icon={<Icon glyph="+" size={24} color={tokens.accentFg} />}
          onPress={() => nav.setTab("create")}
        />
      }
    >
      <SegmentedControl
        aria-label="Period"
        value={period}
        onValueChange={(v) => setPeriod(v as Period)}
        options={[
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "quarter", label: "Quarter" },
        ]}
      />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <CardBody>
            {loading ? (
              <Skeleton lines={3} />
            ) : (
              <Stat
                label="Revenue"
                value={formatINR(numbers.revenue)}
                trend={{ direction: trendDirection(numbers.trend), label: `${Math.abs(numbers.trend)}%`, description: "vs last period" }}
              />
            )}
          </CardBody>
        </Card>
        <Card style={{ flex: 1 }}>
          <CardBody>
            {loading ? (
              <Skeleton lines={3} />
            ) : (
              <Stat label="Customers" value={String(numbers.customers)} help="Billed this period" />
            )}
          </CardBody>
        </Card>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <CardBody>
            {loading ? (
              <Skeleton lines={3} />
            ) : (
              <Stat
                label="Outstanding"
                value={formatINR(invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0))}
                trend={{ direction: "up", label: `${overdue.length} overdue`, invert: true }}
              />
            )}
          </CardBody>
        </Card>
        <Card style={{ flex: 1 }}>
          <CardBody>
            {loading ? (
              <Skeleton lines={3} />
            ) : (
              <Stat label="Paid" value={String(invoices.filter((i) => i.status === "paid").length)} help="Invoices settled" />
            )}
          </CardBody>
        </Card>
      </View>

      <Card>
        <CardBody>
          {loading ? (
            <Skeleton lines={2} />
          ) : (
            <Progress
              label="Collection target"
              value={numbers.collected}
              max={numbers.target}
              showValue
              valueText={`${formatINR(numbers.collected)} of ${formatINR(numbers.target)}`}
              variant={numbers.collected / numbers.target > 0.7 ? "success" : "warning"}
            />
          )}
        </CardBody>
      </Card>

      {overdue.length > 0 && (
        <Alert
          variant="warning"
          title={`${overdue.length} invoice${overdue.length === 1 ? " is" : "s are"} overdue`}
          description="Send a reminder before the weekend."
          actions={
            <Button size="sm" variant="outline" onPress={() => setFilter("unpaid")}>
              Review
            </Button>
          }
        />
      )}

      <Heading action={<Badge variant="accent">{shown.length}</Badge>}>Recent invoices</Heading>
      <Tabs variant="pills" size="sm" value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabList>
          <Tab value="all">All</Tab>
          <Tab value="unpaid" badge={invoices.filter((i) => i.status !== "paid").length}>
            Unpaid
          </Tab>
          <Tab value="paid">Paid</Tab>
        </TabList>
      </Tabs>

      {loading ? (
        <View style={{ gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Skeleton variant="circle" width={40} />
              <View style={{ flex: 1 }}>
                <Skeleton lines={2} lastLineWidth={50} />
              </View>
            </View>
          ))}
        </View>
      ) : shown.length === 0 ? (
        <Muted>No invoices match.</Muted>
      ) : (
        <List style={{ marginHorizontal: -16 }}>
          {shown.map((invoice) => (
            <ListItem
              key={invoice.id}
              leading={<Avatar name={invoice.customer} size="md" />}
              title={invoice.customer}
              description={`${invoice.id} · ${formatINR(invoice.amount)} · due ${formatShortDate(invoice.due)}`}
              trailing={<Badge variant={STATUS_BADGE[invoice.status].variant}>{STATUS_BADGE[invoice.status].label}</Badge>}
              onPress={() => nav.push("invoice", { id: invoice.id })}
            />
          ))}
        </List>
      )}
    </Screen>
  );
}
