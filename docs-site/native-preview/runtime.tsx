// @ts-nocheck — React Native code (types live in the app, not here); the site sees runtime.d.ts instead.
"use client";

/*
 * The React Native side of a docs preview: one demo from native-playground,
 * rendered by react-native-web inside a phone-sized screen.
 *
 * Reached only through the `@native-preview/runtime` alias (next.config.ts),
 * and loaded in the browser only.
 */
import { Component, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { KitProvider, useKitTheme } from "../../source/components/shared/native";
import { SCREEN_ATTR, ScreenContext } from "./rn-shim";
import { nativeDemos } from "./generated/registry";

export interface PhoneScreenProps {
  /** A demo export name from native-playground/demos, e.g. "ButtonDemo". */
  demo: string;
  scheme: "light" | "dark";
  width: number;
  height: number;
  /** Called when the demo cannot be shown, so the frame can say so. */
  onError?(message: string): void;
}

class Boundary extends Component<{ onError?(m: string): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error?.message ?? String(error));
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Surface({ Demo }: { Demo: ComponentType }) {
  const { tokens } = useKitTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 28 }} keyboardShouldPersistTaps="handled">
        <Demo />
      </ScrollView>
    </View>
  );
}

export function PhoneScreen({ demo, scheme, width, height, onError }: PhoneScreenProps) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [Demo, setDemo] = useState<ComponentType | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = nativeDemos[demo];
    if (!load) {
      setMissing(true);
      onError?.(`No demo named ${demo}`);
      return;
    }
    load().then(
      (module) => alive && setDemo(() => module.default),
      (error) => alive && onError?.(error?.message ?? String(error)),
    );
    return () => {
      alive = false;
    };
  }, [demo, onError]);

  const screen = useMemo(() => ({ node, width, height }), [node, width, height]);

  return (
    <div
      ref={setNode}
      {...{ [SCREEN_ATTR]: "" }}
      style={{ position: "relative", width, height, overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <ScreenContext.Provider value={screen}>
        {/* The frame draws the status bar, so the content starts below it. */}
        <KitProvider colorScheme={scheme} insets={{ top: 0, bottom: 16 }}>
          {missing ? (
            <Text style={{ padding: 16 }}>This preview is not available yet.</Text>
          ) : Demo ? (
            <Boundary key={`${demo}-${scheme}`} onError={onError}>
              <Surface Demo={Demo} />
            </Boundary>
          ) : null}
        </KitProvider>
      </ScreenContext.Provider>
    </div>
  );
}
