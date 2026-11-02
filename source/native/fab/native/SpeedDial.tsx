import { useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { CloseGlyph } from "../../../components/shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../../components/shared/native/KitProvider";
import { Overlay } from "../../../components/shared/native/Overlay";
import { mix } from "../../../components/shared/native/theme";
import { Fab, fabColors, type FabPlacement, type FabVariant } from "./Fab";
import { defaultFabText, type FabLocaleText } from "./locale";

export interface SpeedDialAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onPress?(): void;
  disabled?: boolean;
}

export interface SpeedDialProps {
  actions: SpeedDialAction[];
  /** The main button's icon while closed. */
  icon: ReactNode;
  /** Required: the main button has no visible text. */
  "aria-label": string;
  variant?: FabVariant;
  placement?: FabPlacement;
  offset?: number;
  safeArea?: boolean;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  style?: StyleProp<ViewStyle>;
  localeText?: Partial<FabLocaleText>;
}

const themed = createThemedStyles((t) => ({
  column: { position: "absolute", gap: 14, alignItems: "flex-end" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  chip: {
    backgroundColor: t.raised,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: t.radius,
    boxShadow: t.shadow,
  },
  chipText: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "500" },
  mini: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", boxShadow: t.shadow },
  main: { position: "absolute", width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", boxShadow: t.shadow },
}));

type Rect = { x: number; y: number; width: number; height: number };

/** Where the app's window starts on screen; the overlay is full-screen (see shared Anchored). */
function windowTopOffset(windowHeight: number): number {
  if (Platform.OS !== "android") return 0;
  const bar = StatusBar.currentHeight ?? 0;
  return bar > 0 && Dimensions.get("screen").height - windowHeight >= bar - 0.5 ? bar : 0;
}

/**
 * A FAB that opens a short list of related actions above it, over a dimmed
 * screen. Tap outside, press back, or tap the ✕ to close.
 */
export function SpeedDial({
  actions,
  icon,
  "aria-label": ariaLabel,
  variant = "primary",
  placement = "bottom-end",
  offset = 0,
  safeArea = true,
  open: openProp,
  onOpenChange,
  style,
  localeText,
}: SpeedDialProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultFabText, ...localeText }), [localeText]);
  const viewport = useWindowDimensions();
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [own, setOwn] = useState(false);
  const open = openProp ?? own;
  const [rect, setRect] = useState<Rect | null>(null);
  const [layer, setLayer] = useState({ width: 0, height: 0 });
  const colors = fabColors(tokens, variant);

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwn(next);
    onOpenChange?.(next);
  };

  const show = () => {
    anchor.current?.measureInWindow((x, y, width, height) => {
      setRect({ x, y: y + windowTopOffset(viewport.height), width, height });
      setOpen(true);
    });
  };

  return (
    <>
      <Fab
        ref={anchor}
        icon={icon}
        aria-label={ariaLabel}
        variant={variant}
        placement={placement}
        offset={offset}
        safeArea={safeArea}
        onPress={show}
        style={style}
        aria-expanded={open}
      />
      <Overlay open={open && rect !== null} onDismiss={() => setOpen(false)} duration={160}>
        {(progress) =>
          rect && (
            <View
              style={{ flex: 1 }}
              pointerEvents="box-none"
              onLayout={(e: LayoutChangeEvent) => setLayer(e.nativeEvent.layout)}
            >
              {layer.height > 0 && (
                <Animated.View
                  role="menu"
                  style={[
                    s.column,
                    {
                      // Right edges line up with the main button; the column grows upwards from it.
                      right: layer.width - (rect.x + rect.width) + (rect.width - 40) / 2,
                      bottom: layer.height - rect.y + 16,
                      opacity: progress,
                      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                    },
                  ]}
                >
                  {actions.map((action) => (
                    <Pressable
                      key={action.key}
                      role="menuitem"
                      aria-label={action.label}
                      aria-disabled={action.disabled || undefined}
                      disabled={action.disabled}
                      onPress={() => {
                        setOpen(false);
                        action.onPress?.();
                      }}
                      style={[s.row, action.disabled && { opacity: 0.5 }]}
                    >
                      {({ pressed }) => (
                        <>
                          <View style={s.chip}>
                            <Text style={s.chipText}>{action.label}</Text>
                          </View>
                          <View
                            style={[
                              s.mini,
                              { backgroundColor: pressed ? mix(tokens.accentSoft, tokens.fg, 0.1) : tokens.accentSoft },
                            ]}
                          >
                            {action.icon}
                          </View>
                        </>
                      )}
                    </Pressable>
                  ))}
                </Animated.View>
              )}
              {/* The main button again, above the scrim, turned into a close button. */}
              <Pressable
                role="button"
                aria-label={text.close}
                aria-expanded
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  s.main,
                  {
                    left: rect.x + (rect.width - 56) / 2,
                    top: rect.y + (rect.height - 56) / 2,
                    backgroundColor: pressed ? mix(colors.fill, tokens.fg, 0.12) : colors.fill,
                  },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] }) }],
                  }}
                >
                  <CloseGlyph size={20} color={colors.ink} />
                </Animated.View>
              </Pressable>
            </View>
          )
        }
      </Overlay>
    </>
  );
}
