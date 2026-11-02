import { useRef, useState, type ComponentRef, type ReactNode, type RefObject } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Anchored, usePresentation } from "../../shared/native/Anchored";
import { CheckGlyph, ChevronGlyph, CloseGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { Ring } from "../../shared/native/primitives";
import { Sheet } from "../../shared/native/Sheet";
import { alpha } from "../../shared/native/theme";
import type {
  ComboboxLocaleText,
  ComboboxOption,
  ComboboxSize,
  ListItem,
  MatchRange,
  OptionValue,
} from "../core/types";
import { applyStyle, plain, type ComboboxStyles, type ComboboxStyleState, type OptionState } from "./props";
import type { ComboboxState } from "./useCombobox";

type ViewInstance = ComponentRef<typeof View>;

export const HEIGHT: Record<ComboboxSize, number> = { sm: 36, md: 44, lg: 52 };

export const themed = createThemedStyles((t) => ({
  root: { gap: 6 },
  label: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "600" },
  required: { color: t.danger },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: t.radius,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: t.inputBg,
  },
  value: { flex: 1, color: t.fg, fontSize: t.fontSize },
  placeholder: { flex: 1, color: t.muted, fontSize: t.fontSize },
  tags: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, paddingVertical: 4 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 10,
    paddingRight: 4,
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: t.subtle,
    maxWidth: "100%",
  },
  tagText: { color: t.fg, fontSize: t.fontSize - 2, flexShrink: 1 },
  tagRemove: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  overflow: { color: t.muted, fontSize: t.fontSize - 2, alignSelf: "center", paddingHorizontal: 4 },
  iconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
  // The list
  searchRow: { paddingHorizontal: 12, paddingBottom: 8, paddingTop: 4 },
  search: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: t.radius,
    paddingHorizontal: 12,
    paddingVertical: 0,
    color: t.fg,
    fontSize: t.fontSize,
    backgroundColor: t.inputBg,
  },
  group: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    color: t.muted,
    fontSize: t.fontSize - 3,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: t.touchTarget,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { color: t.fg, fontSize: t.fontSize },
  optionDescription: { color: t.muted, fontSize: t.fontSize - 2 },
  mark: { fontWeight: "700", color: t.accent },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  status: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  statusText: { color: t.muted, fontSize: t.fontSize },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: t.borderSubtle,
  },
  footerCount: { flex: 1, color: t.muted, fontSize: t.fontSize - 2 },
  link: { color: t.accent, fontSize: t.fontSize - 1, fontWeight: "600", paddingVertical: 8 },
  done: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: t.radius,
    backgroundColor: t.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { color: t.accentFg, fontWeight: "600", fontSize: t.fontSize },
}));

/** Label, the trigger, then description and error: the same shell as the native Input. */
export function FieldShell({
  label,
  required,
  description,
  error,
  styles,
  state,
  rootStyle,
  children,
}: {
  label?: ReactNode;
  required: boolean;
  description?: ReactNode;
  error?: ReactNode;
  styles?: ComboboxStyles;
  state: ComboboxStyleState;
  rootStyle: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <View style={[s.root, applyStyle(styles?.root, state), rootStyle]}>
      {label !== undefined && (
        <Text style={[s.label, applyStyle(styles?.label, state)]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      )}
      {children}
      {description !== undefined && !error && <Text style={s.description}>{description}</Text>}
      {error !== undefined && error !== null && error !== false && (
        <Text style={s.error} role="alert" aria-live="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

/** The field-like control that opens the list. */
export function Trigger({
  anchorRef,
  open,
  disabled,
  invalid,
  size,
  accessibilityLabel,
  accessibilityValue,
  hint,
  required,
  onPress,
  styles,
  state,
  clearLabel,
  onClear,
  children,
}: {
  anchorRef: RefObject<ViewInstance | null>;
  open: boolean;
  disabled: boolean;
  invalid: boolean;
  size: ComboboxSize;
  accessibilityLabel?: string;
  accessibilityValue: string;
  hint?: string;
  required: boolean;
  onPress(): void;
  styles?: ComboboxStyles;
  state: Omit<ComboboxStyleState, "pressed">;
  clearLabel: string;
  onClear?(): void;
  children: ReactNode;
}) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const border = invalid ? tokens.danger : open ? tokens.focus : tokens.borderControl;
  return (
    <View ref={anchorRef} collapsable={false}>
      <Pressable
        role="combobox"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        aria-required={required || undefined}
        aria-label={accessibilityLabel}
        accessibilityValue={{ text: accessibilityValue }}
        accessibilityHint={hint}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => {
          const st = { ...state, pressed };
          return [
            s.control,
            {
              minHeight: Math.max(HEIGHT[size], size === "sm" ? 0 : tokens.touchTarget),
              borderColor: border,
              outlineColor: alpha(invalid ? tokens.danger : tokens.focus, 0.3),
              outlineWidth: open ? 3 : 0,
              outlineStyle: "solid",
              opacity: disabled ? 0.55 : 1,
              backgroundColor: pressed ? tokens.hover : tokens.inputBg,
            },
            applyStyle(styles?.control, st),
          ];
        }}
      >
        {children}
        {onClear && (
          <Pressable
            role="button"
            aria-label={clearLabel}
            hitSlop={6}
            onPress={onClear}
            style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: tokens.hover }]}
          >
            <CloseGlyph size={12} color={tokens.muted} />
          </Pressable>
        )}
        <ChevronGlyph size={16} color={tokens.muted} direction={open ? "up" : "down"} />
      </Pressable>
    </View>
  );
}

/** A label with its search hits emphasised (the web's `<mark>`). */
function Highlight({ text, matches, style, markStyle }: {
  text: string;
  matches: MatchRange[];
  style: StyleProp<TextStyle>;
  markStyle: StyleProp<TextStyle>;
}) {
  if (matches.length === 0) return <Text style={style}>{text}</Text>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <Text key={i} style={markStyle}>
        {text.slice(start, end)}
      </Text>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <Text style={style}>{parts}</Text>;
}

type Row<V extends OptionValue> = ListItem<V> | { kind: "create"; label: string };

/** Search box, the options (virtualised by FlatList), status rows and a footer. */
export function OptionList<V extends OptionValue>({
  combobox,
  multiple,
  searchable,
  autoFocusSearch,
  loading,
  hasMore,
  onLoadMore,
  emptyMessage,
  text,
  listStyle,
  styles,
  state,
  renderOption,
  footer,
}: {
  combobox: ComboboxState<V>;
  multiple: boolean;
  searchable: boolean;
  autoFocusSearch: boolean;
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?(): void;
  emptyMessage?: ReactNode;
  text: ComboboxLocaleText;
  listStyle: StyleProp<ViewStyle>;
  styles?: ComboboxStyles;
  state: ComboboxStyleState;
  renderOption?(option: ComboboxOption<V>, state: OptionState): ReactNode;
  footer?: ReactNode;
}) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const list = useRef<FlatList<Row<V>>>(null);
  const [scrolled, setScrolled] = useState(false);

  const rows: Row<V>[] = combobox.createLabel
    ? [...combobox.items, { kind: "create", label: combobox.createLabel }]
    : combobox.items;

  // Open on the selected option, as the web list does.
  const startRow = rows.findIndex((row) => row.kind === "option" && row.index === combobox.initialIndex);

  const renderRow = ({ item }: { item: Row<V> }) => {
    if (item.kind === "group") {
      return (
        <Text style={s.group} role="heading">
          {item.label}
        </Text>
      );
    }
    if (item.kind === "create") {
      return (
        <Pressable
          role="button"
          onPress={combobox.commitCreate}
          style={({ pressed }) => [s.option, pressed && { backgroundColor: tokens.hover }]}
        >
          <Text style={[s.optionLabel, { color: tokens.accent }]}>+ {text.createOption(item.label)}</Text>
        </Pressable>
      );
    }
    const { option, matches } = item.entry;
    const selected = combobox.isSelected(option.value);
    const disabled = !!option.disabled;
    return (
      <Pressable
        role="option"
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onPress={() => combobox.selectOption(option)}
        style={({ pressed }) => [
          s.option,
          { opacity: disabled ? 0.45 : 1, backgroundColor: pressed ? tokens.hover : "transparent" },
          applyStyle(styles?.option, { ...state, pressed }),
        ]}
      >
        {({ pressed }) =>
          renderOption ? (
            renderOption(option, { selected, active: pressed })
          ) : (
            <>
              {multiple && (
                <View
                  style={[
                    s.box,
                    {
                      borderColor: selected ? tokens.accent : tokens.borderControl,
                      backgroundColor: selected ? tokens.accent : "transparent",
                    },
                  ]}
                >
                  {selected && <CheckGlyph size={14} color={tokens.accentFg} stroke={2} />}
                </View>
              )}
              {option.icon}
              <View style={s.optionText}>
                <Highlight
                  text={option.label}
                  matches={matches}
                  style={[s.optionLabel, selected && !multiple && { color: tokens.accent, fontWeight: "600" }]}
                  markStyle={s.mark}
                />
                {option.description !== undefined && <Text style={s.optionDescription}>{option.description}</Text>}
              </View>
              {!multiple && selected && <CheckGlyph size={18} color={tokens.accent} stroke={2} />}
            </>
          )
        }
      </Pressable>
    );
  };

  const empty =
    !loading && rows.length === 0 ? (
      <View style={s.status}>
        {typeof emptyMessage === "string" || emptyMessage === undefined ? (
          <Text style={s.statusText}>{emptyMessage ?? text.noResults}</Text>
        ) : (
          emptyMessage
        )}
      </View>
    ) : null;

  return (
    <>
      {searchable && (
        <View style={s.searchRow}>
          <TextInput
            value={combobox.search}
            onChangeText={combobox.setSearch}
            placeholder={text.searchPlaceholder}
            placeholderTextColor={tokens.muted}
            autoFocus={autoFocusSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
            role="searchbox"
            aria-label={text.searchPlaceholder}
            onSubmitEditing={() => {
              if (combobox.createLabel) combobox.commitCreate();
              else if (!multiple) {
                const only = combobox.entries.filter((e) => !e.option.disabled);
                if (only.length === 1) combobox.selectOption(only[0].option);
              }
            }}
            style={[s.search, applyStyle(styles?.search, state)]}
          />
        </View>
      )}
      <FlatList
        ref={list}
        data={rows}
        keyExtractor={(row) =>
          row.kind === "group" ? `g:${row.label}` : row.kind === "create" ? "create" : `o:${String(row.entry.option.value)}`
        }
        renderItem={renderRow}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // React Native has no listbox role; rows still announce as options with their selected state.
        role="list"
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={9}
        onLayout={() => {
          if (scrolled || startRow < 6) return;
          setScrolled(true);
          list.current?.scrollToIndex({ index: startRow, viewPosition: 0.3, animated: false });
        }}
        onScrollToIndexFailed={({ averageItemLength, index }) =>
          list.current?.scrollToOffset({ offset: averageItemLength * index, animated: false })
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasMore && !loading) onLoadMore?.();
        }}
        ListEmptyComponent={empty ?? undefined}
        ListFooterComponent={
          loading ? (
            <View style={s.status} aria-live="polite">
              <Ring size={16} color={tokens.muted} />
              <Text style={s.statusText}>{text.loading}</Text>
            </View>
          ) : undefined
        }
        style={[{ flexGrow: 0, flexShrink: 1 }, listStyle, applyStyle(styles?.list, state)]}
      />
      {footer !== undefined && <View style={[s.footer, applyStyle(styles?.footer, state)]}>{footer}</View>}
    </>
  );
}

/** Where the list lives: a bottom sheet on a phone, a popover under the field on a tablet. */
export function Picker({
  presentation,
  open,
  onDismiss,
  anchorRef,
  title,
  popoverStyle,
  children,
}: {
  presentation: "auto" | "sheet" | "popover";
  open: boolean;
  onDismiss(): void;
  anchorRef: RefObject<ViewInstance | null>;
  title?: ReactNode;
  popoverStyle?: StyleProp<ViewStyle>;
  children: (kind: "sheet" | "popover") => ReactNode;
}) {
  const kind = usePresentation(presentation);
  if (kind === "sheet") {
    return (
      <Sheet open={open} onDismiss={onDismiss} title={plain(title) ?? title}>
        {children("sheet")}
      </Sheet>
    );
  }
  return (
    <Anchored
      open={open}
      onDismiss={onDismiss}
      anchorRef={anchorRef}
      matchWidth
      fitHeight
      style={[{ paddingTop: 8 }, popoverStyle]}
    >
      {children("popover")}
    </Anchored>
  );
}

/** Text buttons in the MultiSelect footer. */
export function LinkButton({ label, onPress }: { label: string; onPress(): void }) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <Pressable role="button" onPress={onPress} hitSlop={8}>
      {({ pressed }) => <Text style={[s.link, pressed && { opacity: 0.6 }]}>{label}</Text>}
    </Pressable>
  );
}

/** The sheet's "Done": a MultiSelect stays open while choosing. */
export function DoneButton({ label, onPress }: { label: string; onPress(): void }) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <Pressable role="button" onPress={onPress} style={({ pressed }) => [s.done, pressed && { opacity: 0.85 }]}>
      <Text style={s.doneText}>{label}</Text>
    </Pressable>
  );
}
