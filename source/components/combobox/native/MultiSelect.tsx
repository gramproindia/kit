import { useImperativeHandle, useMemo, useRef, type ComponentRef, type Ref } from "react";
import { Pressable, Text, View } from "react-native";
import { CloseGlyph } from "../../shared/native/glyphs";
import { useKitTheme } from "../../shared/native/KitProvider";
import { defaultComboboxText } from "../core/locale";
import type { ComboboxOption, OptionValue } from "../core/types";
import { DoneButton, FieldShell, LinkButton, OptionList, Picker, themed, Trigger } from "./parts";
import { applyStyle, plain, type ComboboxHandle, type ComboboxSharedProps } from "./props";
import { useCombobox } from "./useCombobox";

export interface MultiSelectProps<V extends OptionValue = string> extends ComboboxSharedProps<V> {
  value?: V[];
  defaultValue?: V[];
  onChange?(values: NoInfer<V>[], options: ComboboxOption<NoInfer<V>>[]): void;
  /** Maximum number of selections. */
  max?: number;
  /** Tags shown before collapsing into "+N more". Default 3. */
  maxVisibleTags?: number;
  /** Show "Select all" / "Clear all" under the list. Default true. */
  showSelectAll?: boolean;
  /** Close the list after each choice. Default false. */
  closeOnSelect?: boolean;
  ref?: Ref<ComboboxHandle<V>>;
}

/**
 * Multi-select: tags in the field, and a list with checkboxes, select-all and
 * a Done button in a bottom sheet (phone) or popover (tablet).
 */
export function MultiSelect<V extends OptionValue = string>(props: MultiSelectProps<V>) {
  const {
    ref,
    value,
    defaultValue,
    onChange,
    max,
    maxVisibleTags = 3,
    showSelectAll = true,
    closeOnSelect = false,
    label,
    placeholder = "Select…",
    description,
    error,
    required = false,
    disabled = false,
    clearable = true,
    size = "md",
    style,
    styles,
    localeText,
    maxHeight = 280,
    presentation = "auto",
    emptyMessage,
    searchable = true,
    loading = false,
    hasMore,
    onLoadMore,
    renderOption,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultComboboxText, ...localeText }), [localeText]);
  const anchorRef = useRef<ComponentRef<typeof View>>(null);

  const combobox = useCombobox<V>({
    ...props,
    multiple: true,
    closeOnSelect,
    max,
    value,
    defaultValue: defaultValue ?? [],
    onValuesChange: (values, selected) => onChange?.(values, selected),
  });
  useImperativeHandle(ref, () => combobox.handle, [combobox.handle]);

  const { selectedOptions } = combobox;
  const hidden = Math.max(0, selectedOptions.length - maxVisibleTags);
  const visibleTags = hidden > 0 ? selectedOptions.slice(0, maxVisibleTags) : selectedOptions;
  const invalid = error !== undefined && error !== null && error !== false;
  const state = { open: combobox.open, pressed: false, disabled, invalid, size };
  const hint = [plain(error), plain(description)].filter(Boolean).join(". ") || undefined;

  const selectableVisible = combobox.entries.filter(
    (entry) => !entry.option.disabled && !combobox.isSelected(entry.option.value),
  );
  const canSelectAll =
    showSelectAll &&
    selectableVisible.length > 0 &&
    (max === undefined || selectedOptions.length + selectableVisible.length <= max);

  const summary =
    selectedOptions.length === 0 ? placeholder : selectedOptions.map((option) => option.label).join(", ");

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      styles={styles}
      state={state}
      rootStyle={applyStyle(style, state)}
    >
      <Trigger
        anchorRef={anchorRef}
        open={combobox.open}
        disabled={disabled}
        invalid={invalid}
        size={size}
        accessibilityLabel={props["aria-label"] ?? plain(label)}
        accessibilityValue={summary}
        hint={hint}
        required={required}
        onPress={() => combobox.setOpen(!combobox.open)}
        styles={styles}
        state={state}
        clearLabel={text.clearAll}
        onClear={clearable && selectedOptions.length > 0 && !disabled ? combobox.clear : undefined}
      >
        {selectedOptions.length === 0 ? (
          <Text numberOfLines={1} style={[s.placeholder, applyStyle(styles?.value, state)]}>
            {placeholder}
          </Text>
        ) : (
          <View style={s.tags}>
            {visibleTags.map((option) => (
              <View key={String(option.value)} style={[s.tag, applyStyle(styles?.tag, state)]}>
                <Text numberOfLines={1} style={s.tagText}>
                  {option.label}
                </Text>
                {!disabled && (
                  <Pressable
                    role="button"
                    aria-label={text.removeOption(option.label)}
                    hitSlop={8}
                    onPress={() => combobox.removeValue(option.value)}
                    style={({ pressed }) => [s.tagRemove, pressed && { backgroundColor: tokens.hover }]}
                  >
                    <CloseGlyph size={10} color={tokens.muted} />
                  </Pressable>
                )}
              </View>
            ))}
            {hidden > 0 && <Text style={s.overflow}>{text.moreCount(String(hidden))}</Text>}
          </View>
        )}
      </Trigger>

      <Picker
        presentation={presentation}
        open={combobox.open}
        onDismiss={() => combobox.setOpen(false)}
        anchorRef={anchorRef}
        title={label}
        popoverStyle={applyStyle(styles?.popover, state)}
      >
        {(kind) => (
          <OptionList<V>
            combobox={combobox}
            multiple
            searchable={searchable}
            autoFocusSearch={kind === "popover"}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            emptyMessage={emptyMessage}
            text={text}
            listStyle={kind === "popover" ? { maxHeight } : null}
            styles={styles}
            state={state}
            renderOption={renderOption}
            footer={
              <>
                <Text style={s.footerCount} aria-live="polite">
                  {max !== undefined && selectedOptions.length >= max
                    ? text.maxReached(String(max))
                    : text.selectedCount(String(selectedOptions.length))}
                </Text>
                {canSelectAll && <LinkButton label={text.selectAll} onPress={combobox.selectAllVisible} />}
                {selectedOptions.length > 0 && <LinkButton label={text.clearAll} onPress={combobox.clear} />}
                {kind === "sheet" && <DoneButton label={text.done} onPress={() => combobox.setOpen(false)} />}
              </>
            }
          />
        )}
      </Picker>
    </FieldShell>
  );
}
