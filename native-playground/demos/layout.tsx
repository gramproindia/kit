import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const { tokens } = useKitTheme();
  return (
    <View style={styles.section}>
      <Text role="heading" style={[styles.title, { color: tokens.fg }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
});
