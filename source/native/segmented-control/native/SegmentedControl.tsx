import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CheckGlyph } from "../../../components/shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../../components/shared/native/KitProvider";
import { useReducedMotion } from "../../../components/shared/native/motion";
import { mix } from "../../../components/shared/native/theme";
import { useControllableState } from "../../../components/shared/react/useControllableState";

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Drawn before the label. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Spoken name when `label` is not plain text. */
  "aria-label"?: string;
}

interface CommonProps {
  options: SegmentedOption[];
  /** Default `md`. */
  size?: "sm" | "md";
  /** Stretch to the container's width; segments share it equally. Default true. */
  fullWidth?: boolean;
  /**
   * `thumb`: a raised pill slides to the selection (iOS). `check`: outlined
   * segments, the selected ones filled with a check (Material 3).
   * Default `thumb`; multiple selection always uses `check`.
   */
  indicator?: "thumb" | "check";
  disabled?: boolean;
  /** Names the group for screen readers. */
  "aria-label"?: string;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    segment: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    thumb: StyleProp<ViewStyle>;
  }>;
}

export interface SingleSegmentedControlProps extends CommonProps {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
}

export interface MultipleSegmentedControlProps extends CommonProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?(value: string[]): void;
}

export type SegmentedControlProps = SingleSegmentedControlProps | MultipleSegmentedControlProps;

const HEIGHT = { sm: 34, md: 40 } as const;

const themed = createThemedStyles((t) => ({
  track: {
    flexDirection: "row",
    borderRadius: t.radius + 2,
    padding: 2,
    backgroundColor: t.subtle,
  },
  outlined: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.borderControl,
    overflow: "hidden",
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  divider: { width: 1, backgroundColor: t.borderControl },
  thumb: {
    position: "absolute",
    top: 2,
    bottom: 2,
    borderRadius: t.radius,
    backgroundColor: t.raised,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.18)",
  },
  label: { fontWeight: "600", color: t.fg },
}));

type Box = { x: number; width: number };

/**
 * A short row of mutually exclusive (or, with `multiple`, combinable)
 * choices: a view switch, a filter, a unit. For more than about five options
 * use Tabs or a Select.
 */
export function SegmentedControl(props: SegmentedControlProps) {
  const {
    options,
    size = "md",
    fullWidth = true,
    disabled = false,
    style,
    styles: slots,
  } = props;
  const multiple = props.multiple === true;
  const indicator = multiple ? "check" : (props.indicator ?? "thumb");
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();

  const [single, setSingle] = useControllableState<string | undefined>(
    multiple ? undefined : (props.value as string | undefined),
    () => (multiple ? undefined : ((props.defaultValue as string | undefined) ?? options[0]?.value)),
  );
  const [many, setMany] = useControllableState<string[]>(
    multiple ? (props.value as string[] | undefined) : undefined,
    () => (multiple ? ((props.defaultValue as string[] | undefined) ?? []) : []),
  );

  const isSelected = (value: string) => (multiple ? many.includes(value) : single === value);

  const select = (value: string) => {
    if (multiple) {
      const next = many.includes(value) ? many.filter((v) => v !== value) : [...many, value];
      setMany(next);
      (props as MultipleSegmentedControlProps).onValueChange?.(next);
    } else if (single !== value) {
      setSingle(value);
      (props as SingleSegmentedControlProps).onValueChange?.(value);
    }
  };

  // Thumb: measured segment boxes, animated on the JS thread (left/width
  // cannot run on the native driver).
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const left = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const target = !multiple && single !== undefined ? boxes[single] : undefined;

  useEffect(() => {
    if (!target) return;
    if (!placed.current || reduced) {
      left.setValue(target.x);
      width.setValue(target.width);
      placed.current = true;
      return;
    }
    const animation = Animated.parallel([
      Animated.spring(left, { toValue: target.x, useNativeDriver: false, bounciness: 0, speed: 18 }),
      Animated.spring(width, { toValue: target.width, useNativeDriver: false, bounciness: 0, speed: 18 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [target?.x, target?.width, reduced, left, width, target]);

  const onSegmentLayout = (value: string) => (event: LayoutChangeEvent) => {
    const { x, width: w } = event.nativeEvent.layout;
    setBoxes((prev) => {
      const old = prev[value];
      if (old && Math.abs(old.x - x) < 0.5 && Math.abs(old.width - w) < 0.5) return prev;
      return { ...prev, [value]: { x, width: w } };
    });
  };

  const height = HEIGHT[size];
  const fontSize = size === "sm" ? tokens.fontSize - 2 : tokens.fontSize - 1;
  const thumbMode = indicator === "thumb";

  return (
    <View
      role={multiple ? "group" : "radiogroup"}
      aria-label={props["aria-label"]}
      aria-disabled={disabled || undefined}
      style={[
        thumbMode ? s.track : s.outlined,
        { alignSelf: fullWidth ? "stretch" : "flex-start", opacity: disabled ? 0.5 : 1 },
        slots?.root,
        style,
      ]}
    >
      {thumbMode && target && (
        <Animated.View style={[s.thumb, { left, width }, slots?.thumb]} pointerEvents="none" />
      )}
      {options.map((option, index) => {
        const selected = isSelected(option.value);
        const off = disabled || option.disabled;
        const fill = !thumbMode && selected ? tokens.accentSoft : "transparent";
        const ink = !thumbMode && selected ? tokens.accentStrong : tokens.fg;
        return (
          <View
            key={option.value}
            onLayout={onSegmentLayout(option.value)}
            style={{ flexDirection: "row", flex: fullWidth ? 1 : undefined }}
          >
            {!thumbMode && index > 0 && <View style={s.divider} />}
            <Pressable
              role={multiple ? "checkbox" : "radio"}
              aria-checked={selected}
              aria-selected={selected}
              aria-disabled={off || undefined}
              aria-label={option["aria-label"]}
              disabled={off}
              onPress={() => select(option.value)}
              hitSlop={size === "sm" ? 5 : 2}
              style={({ pressed }) => [
                s.segment,
                {
                  flex: fullWidth ? 1 : undefined,
                  height: thumbMode ? height - 4 : height - 2,
                  backgroundColor: pressed && !selected ? mix(fill === "transparent" ? tokens.subtle : fill, tokens.fg, 0.06) : fill,
                  borderRadius: thumbMode ? tokens.radius : 0,
                  opacity: option.disabled && !disabled ? 0.45 : 1,
                },
                slots?.segment,
              ]}
            >
              {!thumbMode && selected && <CheckGlyph size={14} color={ink} />}
              {option.icon && <View aria-hidden>{option.icon}</View>}
              {typeof option.label === "string" || typeof option.label === "number" ? (
                <Text
                  numberOfLines={1}
                  style={[s.label, { fontSize, color: ink, fontWeight: selected ? "700" : "600" }, slots?.label]}
                >
                  {option.label}
                </Text>
              ) : (
                option.label
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
