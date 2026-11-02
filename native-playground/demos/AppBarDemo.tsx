import { useState } from "react";
import { ScrollView, View } from "react-native";
import { AppBar, AppBarAction } from "../../source/native/app-bar";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";
import { FakeRows, MiniScreen, TextIcon } from "./mobileFrame";

export function AppBarDemo() {
  const { tokens } = useKitTheme();
  const [scrolled, setScrolled] = useState(false);
  const actions = [
    <AppBarAction key="search" aria-label="Search">
      <TextIcon glyph="⌕" color={tokens.fg} size={22} />
    </AppBarAction>,
    <AppBarAction key="more" aria-label="More options">
      <TextIcon glyph="⋮" color={tokens.fg} size={22} />
    </AppBarAction>,
  ];
  return (
    <>
      <Section title="AppBar · small, center, back">
        <View style={{ gap: 10 }}>
          <MiniScreen height={56}>
            <AppBar safeArea={false} title="Invoices" subtitle="12 unpaid" actions={actions} />
          </MiniScreen>
          <MiniScreen height={56}>
            <AppBar safeArea={false} variant="center" title="Settings" onBack={() => {}} actions={actions[1]} />
          </MiniScreen>
          <MiniScreen height={56}>
            <AppBar safeArea={false} title="Invoice #1042" onBack={() => {}} elevated />
          </MiniScreen>
        </View>
      </Section>

      <Section title="AppBar · large title, elevation on scroll">
        <MiniScreen>
          <AppBar
            safeArea={false}
            variant={scrolled ? "small" : "large"}
            title="Payments"
            scrolled={scrolled}
            actions={actions}
          />
          <ScrollView
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 8)}
          >
            <FakeRows count={10} prefix="Payment" />
          </ScrollView>
        </MiniScreen>
      </Section>

      <Section title="AppBar · medium">
        <MiniScreen height={112}>
          <AppBar safeArea={false} variant="medium" title="Customers" subtitle="Kerala region" onBack={() => {}} />
        </MiniScreen>
      </Section>
    </>
  );
}
