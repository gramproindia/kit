import { useState } from "react";
import { Text } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";
import { List, ListItem } from "../../source/native/list-item";
import { SearchBar } from "../../source/native/search-bar";
import { Section } from "./layout";

const CITIES = ["Kochi", "Kozhikode", "Kollam", "Kannur", "Thiruvananthapuram", "Thrissur", "Palakkad", "Bengaluru", "Chennai", "Mumbai"];

export function SearchBarDemo() {
  const { tokens } = useKitTheme();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const results = query ? CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <>
      <Section title="SearchBar · debounced, with Cancel">
        <SearchBar
          showCancel
          loading={loading}
          onValueChange={() => setLoading(true)}
          onSearch={(q) => {
            setQuery(q);
            setLoading(false);
          }}
          onSubmit={setSubmitted}
          localeText={{ placeholder: "Search cities" }}
        />
        <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>
          {query ? `${results.length} result(s) for “${query}”` : "Results appear 250 ms after you stop typing."}
          {submitted ? ` · submitted “${submitted}”` : ""}
        </Text>
        {results.length > 0 && (
          <List variant="inset">
            {results.map((city) => (
              <ListItem key={city} title={city} />
            ))}
          </List>
        )}
      </Section>
      <Section title="SearchBar · plain and disabled">
        <SearchBar defaultValue="GST invoices" />
        <SearchBar disabled />
      </Section>
    </>
  );
}
