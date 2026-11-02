import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Animated,
  Easing,
  I18nManager,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { Ring } from "../../shared/native/primitives";
import { mix } from "../../shared/native/theme";
import { defaultSwitchText } from "../core/locale";
import { adopt, idleToggle, request, settle } from "../core/toggle";
import type { SwitchLabelPosition, SwitchLocaleText, SwitchSize } from "../core/types";
import { useReducedMotion } from "../../shared/native/motion";

export type SwitchSlot = "root" | "control" | "track" | "thumb" | "label" | "description" | "error";

/** What `style` callbacks receive: the native stand-in for the web's `data-*`. */
export interface SwitchStyleState {
  checked: boolean;
  pressed: boolean;
  disabled: boolean;
  readOnly: boolean;
  saving: boolean;
  invalid: boolean;
  size: SwitchSize;
}

export interface SwitchProps
  extends Omit<PressableProps, "children" | "style" | "onPress" | "disabled" | "role"> {
  /** On or off (controlled). */
  checked?: boolean;
  /** The starting state when you are not controlling `checked`. */
  defaultChecked?: boolean;
  /**
   * Fires with the new state. Return a promise and the switch stays on the new
   * setting with a busy indicator until it resolves, then puts itself back if
   * it rejects.
   */
  onCheckedChange?(checked: boolean): void | Promise<unknown>;
  /** The text beside the track. Tapping it flips the switch. */
  label?: ReactNode;
  /** A hint under the label, read as the switch's hint. */
  description?: ReactNode;
  /** The validation message. Setting it is enough: it is shown and announced. */
  error?: ReactNode;
  /** Default `md`. */
  size?: SwitchSize;
  /** Default `end`: the label after the track. `start` puts the track on the right, for settings rows. */
  labelPosition?: SwitchLabelPosition;
  /** Show the busy state and block presses from outside, e.g. while a form saves. */
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  style?: StyleProp<ViewStyle> | ((state: SwitchStyleState) => StyleProp<ViewStyle>);
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    control: StyleProp<ViewStyle>;
    track: StyleProp<ViewStyle>;
    thumb: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    error: StyleProp<TextStyle>;
  }>;
  localeText?: Partial<SwitchLocaleText>;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

// Larger than the web's 36×20: a phone switch is pressed with a thumb.
const TRACK: Record<SwitchSize, { width: number; height: number; gap: number }> = {
  sm: { width: 36, height: 22, gap: 2 },
  md: { width: 44, height: 26, gap: 3 },
  lg: { width: 52, height: 32, gap: 3 },
};

const themed = createThemedStyles((t) => ({
  root: { flexDirection: "row", alignItems: "flex-start", gap: 10, minHeight: t.touchTarget, paddingVertical: 4 },
  start: { flexDirection: "row-reverse", justifyContent: "space-between" },
  control: { justifyContent: "center", minHeight: Math.round(t.fontSize * 1.4) },
  track: { borderRadius: 999, overflow: "hidden", justifyContent: "center" },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t.accent },
  thumb: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
  },
  text: { flexShrink: 1, gap: 2 },
  startText: { flex: 1 },
  label: { fontSize: t.fontSize, fontWeight: "500", color: t.fg, lineHeight: Math.round(t.fontSize * 1.4) },
  required: { color: t.danger },
  description: { fontSize: t.fontSize - 1, color: t.muted },
  error: { fontSize: t.fontSize - 1, color: t.danger },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0 },
}));

const plain = (node: ReactNode) => (typeof node === "string" || typeof node === "number" ? String(node) : undefined);

/**
 * An on/off setting that takes effect at once. Announced as a switch ("on" /
 * "off"), and an async `onCheckedChange` keeps it on the new setting while it
 * saves, putting it back if the save fails.
 */
export function Switch(props: SwitchProps) {
  const {
    ref,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    error,
    size = "md",
    labelPosition = "end",
    loading = false,
    disabled = false,
    readOnly = false,
    required = false,
    style,
    styles: slots,
    localeText,
    "aria-label": ariaLabel,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultSwitchText, ...localeText }), [localeText]);

  const [state, setState] = useState(() => idleToggle(checkedProp ?? defaultChecked));
  const controlled = checkedProp !== undefined;
  // A controlled value is the truth, and a new one ends anything still in
  // flight. Adjusted while rendering, so the old setting never paints first.
  const [seen, setSeen] = useState(checkedProp);
  if (checkedProp !== seen) {
    setSeen(checkedProp);
    if (checkedProp !== undefined) setState((current) => adopt(current, checkedProp));
  }
  // Between changes the prop wins outright, so a parent that declines a change
  // puts the switch back by itself.
  const checked = controlled && state.pending === null ? checkedProp : state.checked;
  const saving = state.pending !== null || loading;
  const locked = disabled || readOnly || saving;
  const invalid = Boolean(error);

  const change = useCallback(
    (next: boolean) => {
      const result = onCheckedChange?.(next);
      if (typeof (result as Promise<unknown> | undefined)?.then !== "function") {
        setState((current) => settle(request(current, next), next, true));
        return;
      }
      setState((current) => request(current, next));
      void (result as Promise<unknown>).then(
        () => setState((current) => settle(current, next, true)),
        () => setState((current) => settle(current, next, false)),
      );
    },
    [onCheckedChange],
  );

  const reduced = useReducedMotion();
  const position = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      position.setValue(checked ? 1 : 0);
      return;
    }
    const animation = Animated.timing(position, {
      toValue: checked ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [position, checked, reduced]);

  const track = TRACK[size];
  const thumb = track.height - track.gap * 2;
  const travel = (track.width - track.height) * (I18nManager.isRTL ? -1 : 1);
  const fontSize = size === "sm" ? tokens.fontSize - 1 : size === "lg" ? tokens.fontSize + 1 : tokens.fontSize;
  const offColor = mix(tokens.subtle, tokens.fg, 0.14);
  const hint = [plain(description), plain(error)].filter(Boolean).join(". ") || undefined;

  return (
    <Pressable
      ref={ref}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || readOnly || undefined}
      aria-busy={saving || undefined}
      aria-label={ariaLabel ?? plain(label)}
      accessibilityHint={hint}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={() => !locked && change(!checked)}
      disabled={disabled}
      onPress={() => !locked && change(!checked)}
      {...rest}
      style={({ pressed }) => {
        const st: SwitchStyleState = { checked, pressed, disabled, readOnly, saving, invalid, size };
        return [s.root, labelPosition === "start" && s.start, slots?.root, typeof style === "function" ? style(st) : style];
      }}
    >
      {({ pressed }) => (
        <>
          <View style={[s.control, slots?.control]}>
            <View
              style={[
                s.track,
                {
                  width: track.width,
                  height: track.height,
                  padding: track.gap,
                  backgroundColor: pressed && !locked ? mix(offColor, tokens.fg, 0.12) : offColor,
                  opacity: disabled ? 0.5 : 1,
                },
                invalid && { borderWidth: 1, borderColor: tokens.danger },
                slots?.track,
              ]}
            >
              <Animated.View
                style={[
                  s.fill,
                  pressed && !locked && { backgroundColor: mix(tokens.accent, "#000000", 0.12) },
                  { opacity: position },
                ]}
              />
              <Animated.View
                style={[
                  s.thumb,
                  { width: thumb, height: thumb },
                  { transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }] },
                  slots?.thumb,
                ]}
              >
                {saving && <Ring size={thumb - 4} color={tokens.accent} thickness={2} />}
              </Animated.View>
            </View>
          </View>
          {(label || description || error) && (
            <View style={[s.text, labelPosition === "start" && s.startText]}>
              {label !== undefined &&
                label !== null &&
                (plain(label) !== undefined ? (
                  <Text style={[s.label, { fontSize }, disabled && { color: tokens.muted }, slots?.label]}>
                    {label}
                    {required && <Text style={s.required}> *</Text>}
                  </Text>
                ) : (
                  label
                ))}
              {description !== undefined &&
                description !== null &&
                (plain(description) !== undefined ? (
                  <Text style={[s.description, slots?.description]}>{description}</Text>
                ) : (
                  description
                ))}
              {invalid &&
                (plain(error) !== undefined ? (
                  <Text role="alert" style={[s.error, slots?.error]}>
                    {error}
                  </Text>
                ) : (
                  error
                ))}
            </View>
          )}
          {/* Only the fact that something is being saved needs announcing; the
              switch already reads its own new state. */}
          <Text style={s.srOnly} aria-live="polite">
            {saving ? text.saving : ""}
          </Text>
        </>
      )}
    </Pressable>
  );
}
