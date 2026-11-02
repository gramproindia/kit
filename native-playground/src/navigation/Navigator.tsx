import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Animated, BackHandler, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import { useKitTheme, useReducedMotion } from "../../../source/components/shared/native";

/**
 * A tiny navigator built for the demo, so the app dogfoods Kit instead of a
 * navigation library: one stack per tab, a short slide on push and pop, and
 * Android back pops the stack, then returns to the first tab.
 */
export type TabKey = "home" | "create" | "components" | "settings";

export interface Route {
  key: number;
  name: string;
  params?: Record<string, unknown>;
}

interface NavValue {
  tab: TabKey;
  setTab(tab: TabKey): void;
  push(name: string, params?: Record<string, unknown>): void;
  pop(): void;
  /** Back to the first screen of the current tab. */
  popToTop(): void;
}

const NavContext = createContext<NavValue | null>(null);
const RouteContext = createContext<Route | null>(null);

export function useNav(): NavValue {
  const value = useContext(NavContext);
  if (!value) throw new Error("useNav needs <Navigator>.");
  return value;
}

/** The current screen's route; `params` hold what `push` passed. */
export function useRoute<P extends Record<string, unknown> = Record<string, unknown>>(): Route & { params: P } {
  const route = useContext(RouteContext);
  if (!route) throw new Error("useRoute needs a screen rendered by <Navigator>.");
  return route as Route & { params: P };
}

/** Whether this screen was pushed, so it shows a back button. */
export function useCanGoBack(): boolean {
  const route = useContext(RouteContext);
  return !!route && route.key >= 1000;
}

let nextKey = 1000;

function RouteView({
  route,
  depth,
  leaving,
  onLeft,
  screen: Screen,
}: {
  route: Route;
  depth: number;
  leaving: boolean;
  onLeft(key: number): void;
  screen: ComponentType;
}) {
  const { tokens } = useKitTheme();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(depth === 0 ? 1 : 0)).current;

  useEffect(() => {
    if (depth === 0) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // Runs once, on push.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!leaving) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: reduced ? 0 : 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onLeft(route.key));
  }, [leaving, progress, reduced, onLeft, route.key]);

  return (
    <Animated.View
      pointerEvents={leaving ? "none" : "auto"}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: tokens.bg,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }],
        },
      ]}
    >
      <RouteContext.Provider value={route}>
        <Screen />
      </RouteContext.Provider>
    </Animated.View>
  );
}

export interface NavigatorProps {
  /** Screen components by name; each tab's first screen is named after the tab. */
  screens: Record<string, ComponentType>;
  /** The bar under the stacks, given the current tab and a setter. */
  renderTabBar(tab: TabKey, setTab: (tab: TabKey) => void): ReactNode;
}

const TABS: TabKey[] = ["home", "create", "components", "settings"];

export function Navigator({ screens, renderTabBar }: NavigatorProps) {
  const [tab, setTab] = useState<TabKey>("home");
  const [stacks, setStacks] = useState<Record<TabKey, Route[]>>(() =>
    Object.fromEntries(TABS.map((t, i) => [t, [{ key: i, name: t }]])) as Record<TabKey, Route[]>,
  );
  const [leaving, setLeaving] = useState<Set<number>>(new Set());

  const push = useCallback(
    (name: string, params?: Record<string, unknown>) => {
      setStacks((all) => ({ ...all, [tab]: [...all[tab], { key: nextKey++, name, params }] }));
    },
    [tab],
  );

  const pop = useCallback(() => {
    const stack = stacks[tab].filter((r) => !leaving.has(r.key));
    if (stack.length < 2) return;
    const top = stack[stack.length - 1];
    setLeaving((set) => new Set(set).add(top.key));
  }, [stacks, tab, leaving]);

  const popToTop = useCallback(() => {
    setStacks((all) => ({ ...all, [tab]: all[tab].slice(0, 1) }));
  }, [tab]);

  const onLeft = useCallback((key: number) => {
    setStacks((all) => {
      const next = { ...all };
      for (const t of TABS) next[t] = all[t].filter((r) => r.key !== key);
      return next;
    });
    setLeaving((set) => {
      const next = new Set(set);
      next.delete(key);
      return next;
    });
  }, []);

  // Android back: pop this tab's stack, then go to the first tab, then leave the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      const stack = stacks[tab].filter((r) => !leaving.has(r.key));
      if (stack.length > 1) {
        pop();
        return true;
      }
      if (tab !== "home") {
        setTab("home");
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [stacks, tab, leaving, pop]);

  const value = useMemo<NavValue>(() => ({ tab, setTab, push, pop, popToTop }), [tab, push, pop, popToTop]);

  return (
    <NavContext.Provider value={value}>
      <View style={styles.root}>
        <View style={styles.stacks}>
          {TABS.map((t) => (
            // Every tab stays mounted, so switching back keeps its scroll and form state.
            <View key={t} style={[StyleSheet.absoluteFill, t !== tab && styles.hidden]} pointerEvents={t === tab ? "auto" : "none"}>
              {stacks[t].map((route, depth) => {
                const screen = screens[route.name];
                return screen ? (
                  <RouteView
                    key={route.key}
                    route={route}
                    depth={depth}
                    leaving={leaving.has(route.key)}
                    onLeft={onLeft}
                    screen={screen}
                  />
                ) : null;
              })}
            </View>
          ))}
        </View>
        {renderTabBar(tab, setTab)}
      </View>
    </NavContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stacks: { flex: 1 },
  hidden: { display: "none" },
});
