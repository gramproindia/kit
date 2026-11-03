import { useEffect, useMemo, useRef, useState, type ComponentRef, type Ref } from "react";
import {
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CloseGlyph } from "../../../components/shared/native/glyphs";
import { KitIcon } from "../../../components/shared/native/icons";
import { createThemedStyles, useKitTheme } from "../../../components/shared/native/KitProvider";
import { useReducedMotion } from "../../../components/shared/native/motion";
import { Ring } from "../../../components/shared/native/primitives";
import { mix } from "../../../components/shared/native/theme";
import { useControllableState } from "../../../components/shared/react/useControllableState";
import { defaultSearchBarText, type SearchBarLocaleText } from "./locale";

export interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  /** Every keystroke. */
  onValueChange?(value: string): void;
  /** The keyboard's search key. */
  onSubmit?(value: string): void;
  /** Debounced by `debounce` ms; also called with "" when cleared. */
  onSearch?(value: string): void;
  /** Delay for `onSearch`, in ms. Default 250. */
  debounce?: number;
  /**
   * Show a Cancel text button while focused (iOS style). Cancel clears the
   * text and dismisses the keyboard. Default false.
   */
  showCancel?: boolean;
  onCancel?(): void;
  /** Spinner in place of the clear button, e.g. while results load. */
  loading?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Overrides the locale placeholder. */
  placeholder?: string;
  localeText?: Partial<SearchBarLocaleText>;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ field: StyleProp<ViewStyle>; input: StyleProp<TextStyle>; cancel: StyleProp<TextStyle> }>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

const themed = createThemedStyles((t) => ({
  root: { flexDirection: "row", alignItems: "center", gap: 10 },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: t.touchTarget - 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: t.subtle,
    borderWidth: 1,
    borderColor: "transparent",
  },
  input: { flex: 1, fontSize: t.fontSize, color: t.fg, paddingVertical: 0 },
  end: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  clear: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cancel: { fontSize: t.fontSize, color: t.accent, fontWeight: "600" },
  // Wide so the label is measured on one line, at its natural width.
  measure: { position: "absolute", opacity: 0, left: 0, top: 0, width: 4000, alignItems: "flex-start" },
}));

/** The magnifier: the app's `search` icon if KitProvider has one, else drawn. */
function Magnifier({ color, size = 16 }: { color: string; size?: number }) {
  return <KitIcon name="search" size={size} color={color} fallback={<DrawnMagnifier color={color} size={size} />} />;
}

/** A magnifier drawn with Views: a ring and a rotated handle. */
function DrawnMagnifier({ color, size = 16 }: { color: string; size?: number }) {
  const ring = size * 0.7;
  return (
    <View style={{ width: size, height: size }} aria-hidden>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.38,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          left: ring * 0.78,
          top: ring * 0.92,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

/**
 * A rounded search field: magnifier, clear button, optional Cancel, and a
 * debounced `onSearch` for live results.
 */
export function SearchBar({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onSearch,
  debounce = 250,
  showCancel = false,
  onCancel,
  loading = false,
  autoFocus,
  disabled = false,
  placeholder,
  localeText,
  style,
  styles: slots,
  ref,
}: SearchBarProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const text = useMemo(() => ({ ...defaultSearchBarText, ...localeText }), [localeText]);
  const [value, setValue] = useControllableState(valueProp, defaultValue);
  const [focused, setFocused] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  // Debounced onSearch. A ref keeps the latest callback without restarting the timer.
  const searchRef = useRef(onSearch);
  useEffect(() => {
    searchRef.current = onSearch;
  });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (value === "") {
      searchRef.current?.("");
      return;
    }
    const timer = setTimeout(() => searchRef.current?.(value), debounce);
    return () => clearTimeout(timer);
  }, [value, debounce]);

  // Cancel slides in while focused.
  const cancelShown = showCancel && focused;
  const reveal = useRef(new Animated.Value(0)).current;
  const [cancelWidth, setCancelWidth] = useState(0);
  useEffect(() => {
    Animated.timing(reveal, {
      toValue: cancelShown ? 1 : 0,
      duration: reduced ? 0 : 160,
      useNativeDriver: false,
    }).start();
  }, [cancelShown, reduced, reveal]);

  const change = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  const setRefs = (node: ComponentRef<typeof TextInput> | null) => {
    input.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: typeof node }).current = node;
  };

  return (
    <View style={[s.root, style]}>
      <View
        style={[
          s.field,
          focused && { borderColor: tokens.focus, backgroundColor: tokens.inputBg },
          disabled && { opacity: 0.5 },
          slots?.field,
        ]}
      >
        <Magnifier color={tokens.muted} />
        <TextInput
          ref={setRefs}
          role="searchbox"
          aria-label={placeholder ?? text.placeholder}
          value={value}
          onChangeText={change}
          onSubmitEditing={() => onSubmit?.(value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? text.placeholder}
          placeholderTextColor={tokens.muted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={autoFocus}
          editable={!disabled}
          selectionColor={tokens.accent}
          style={[s.input, slots?.input]}
        />
        <View style={s.end}>
          {loading ? (
            <View aria-label={text.loading} aria-busy>
              <Ring size={16} color={tokens.muted} />
            </View>
          ) : value !== "" && !disabled ? (
            <Pressable
              role="button"
              aria-label={text.clear}
              hitSlop={12}
              onPress={() => {
                change("");
                input.current?.focus();
              }}
              style={({ pressed }) => [
                s.clear,
                { backgroundColor: pressed ? mix(tokens.muted, tokens.fg, 0.3) : tokens.muted },
              ]}
            >
              <CloseGlyph size={10} color={tokens.bg} stroke={2} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {showCancel && (
        // Measured here, outside the clipping box below: inside it the label
        // is laid out in whatever width the box has at that moment (0 while
        // hidden) and can come back truncated.
        <View style={s.measure} pointerEvents="none" aria-hidden>
          <Text
            numberOfLines={1}
            style={[s.cancel, slots?.cancel]}
            onLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.layout.width);
              if (Math.abs(w - cancelWidth) > 0.5 && w > 0) setCancelWidth(w);
            }}
          >
            {text.cancel}
          </Text>
        </View>
      )}
      {showCancel && (
        <Animated.View
          style={{
            overflow: "hidden",
            width: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, cancelWidth] }),
            opacity: reveal,
            // marginStart, not marginLeft: it tucks under the row's gap on the
            // side the button actually sits, which flips in right-to-left.
            marginStart: reveal.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
          }}
          pointerEvents={cancelShown ? "auto" : "none"}
        >
          <Pressable
            role="button"
            hitSlop={10}
            onPress={() => {
              change("");
              input.current?.blur();
              onCancel?.();
            }}
            style={{ alignSelf: "flex-start", width: cancelWidth || undefined }}
          >
            <Text numberOfLines={1} style={[s.cancel, slots?.cancel]}>
              {text.cancel}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
