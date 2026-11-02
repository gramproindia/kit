import { useMemo, useState } from "react";
import { View } from "react-native";
import { Badge } from "../../../source/components/badge";
import { ListItem, ListSection } from "../../../source/native/list-item";
import { SearchBar } from "../../../source/native/search-bar";
import { useNav, useRoute } from "../navigation/Navigator";
import { Muted, Screen, useSuppressRootHosts } from "../ui/kit";
import { CATALOG, GROUP_ORDER } from "./catalog";

export function ComponentsScreen() {
  const nav = useNav();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = CATALOG.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
    );
    return GROUP_ORDER.map((group) => ({ group, items: hits.filter((c) => c.group === group) })).filter((g) => g.items.length);
  }, [query]);

  return (
    <Screen
      title="Components"
      subtitle={`${CATALOG.length} demos · React Native beta`}
      header={
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <SearchBar onSearch={setQuery} debounce={0} localeText={{ placeholder: "Search components" }} />
        </View>
      }
    >
      {groups.length === 0 && <Muted>No component matches “{query}”.</Muted>}
      {groups.map(({ group, items }) => (
        <ListSection key={group} header={group}>
          {items.map((c) => (
            <ListItem
              key={c.id}
              title={c.name}
              description={c.description}
              trailing={c.mobileOnly ? <Badge variant="accent">Mobile</Badge> : undefined}
              chevron
              onPress={() => nav.push("demo", { id: c.id })}
            />
          ))}
        </ListSection>
      ))}
    </Screen>
  );
}

/** One catalog entry: its demos from native-playground/demos, as in the docs. */
export function DemoScreen() {
  const { params } = useRoute<{ id: string }>();
  const entry = CATALOG.find((c) => c.id === params.id);
  useSuppressRootHosts(!!entry?.ownHosts);
  if (!entry) return <Screen title="Not found" />;
  return (
    <Screen title={entry.name} subtitle={entry.group}>
      <Muted>{entry.description}</Muted>
      {entry.demos.map((Demo, index) => (
        <View key={index} style={{ gap: 28 }}>
          <Demo />
        </View>
      ))}
    </Screen>
  );
}
