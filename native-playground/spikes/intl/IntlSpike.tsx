import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useKitTheme } from "../../../source/components/shared/native";
import { runAll } from "./checks";
import expected from "./expected.json";

type Row = { key: string; expected: unknown; actual: unknown; same: boolean };

const show = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));

export function IntlSpike() {
  const { tokens } = useKitTheme();
  const [onlyDiffs, setOnlyDiffs] = useState(true);

  const rows = useMemo<Row[]>(() => {
    const actual = runAll();
    const base = expected as Record<string, unknown>;
    const list = Object.keys(actual).map((key) => ({
      key,
      expected: base[key],
      actual: actual[key],
      same: show(base[key]) === show(actual[key]),
    }));
    const diffs = list.filter((r) => !r.same);
    // Read by the dev machine from the Metro log; chunked because long log lines are cut.
    console.log(`S1 SUMMARY ${list.length - diffs.length}/${list.length} match`);
    for (const r of diffs) console.log(`S1 DIFF ${JSON.stringify(r)}`);
    console.log("S1 DONE");
    return list;
  }, []);

  const diffCount = rows.filter((r) => !r.same).length;
  const data = onlyDiffs ? rows.filter((r) => !r.same) : rows;

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <Text style={[styles.title, { color: tokens.fg }]} role="heading">
        S1 · Intl on Hermes
      </Text>
      <Text style={[styles.summary, { color: tokens.fg }]}>
        {rows.length - diffCount}/{rows.length} match Node · {diffCount} differ
      </Text>
      <Pressable
        role="switch"
        aria-checked={onlyDiffs}
        onPress={() => setOnlyDiffs((v) => !v)}
        style={styles.toggle}
      >
        <Text style={{ color: tokens.accent }}>{onlyDiffs ? "Showing differences · tap for all" : "Showing all · tap for differences"}</Text>
      </Pressable>
      <FlatList
        data={data}
        keyExtractor={(r) => r.key}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: tokens.border }, !item.same && { backgroundColor: tokens.accentSoft }]}>
            <Text style={[styles.key, { color: tokens.fg }]}>{item.key}</Text>
            <Text style={{ color: tokens.fg }}>phone: {show(item.actual)}</Text>
            {!item.same && <Text style={{ color: tokens.muted }}>node: {show(item.expected)}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 12, paddingHorizontal: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  summary: { marginVertical: 6 },
  toggle: { paddingVertical: 8 },
  row: { paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  key: { fontWeight: "600" },
});
