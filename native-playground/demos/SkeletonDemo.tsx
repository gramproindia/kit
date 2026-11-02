import { Text, View } from "react-native";
import { Button } from "../../source/components/button";
import { useKitTheme } from "../../source/components/shared/native";
import { Empty, Skeleton } from "../../source/components/skeleton";
import { Section } from "./layout";

export function SkeletonDemo() {
  const { tokens } = useKitTheme();
  return (
    <>
      <Section title="Skeleton · pulse">
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Skeleton variant="circle" width={48} />
          <View style={{ flex: 1 }}>
            <Skeleton lines={2} lastLineWidth={45} />
          </View>
        </View>
        <Skeleton variant="rect" height={120} label="Loading the chart" />
      </Section>

      <Section title="Skeleton · wave">
        <Skeleton lines={4} animation="wave" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Skeleton variant="rect" width="48%" height={90} radius={16} animation="wave" />
          <Skeleton variant="rect" width="48%" height={90} radius={16} animation="wave" />
        </View>
      </Section>

      <Section title="Skeleton · none">
        <Skeleton lines={3} animation="none" />
      </Section>

      <Section title="Empty">
        <View style={{ borderWidth: 1, borderColor: tokens.border, borderRadius: tokens.radius }}>
          <Empty
            icon={<Text style={{ fontSize: 36 }}>🗂️</Text>}
            title="No invoices yet"
            description="Invoices you create or import show up here. Start with one, or import last year's from a spreadsheet."
            actions={
              <>
                <Button>New invoice</Button>
                <Button variant="outline">Import</Button>
              </>
            }
          />
        </View>
        <View style={{ borderWidth: 1, borderColor: tokens.border, borderRadius: tokens.radius }}>
          <Empty size="sm" title="No results" description="Try a shorter search." />
        </View>
      </Section>
    </>
  );
}
