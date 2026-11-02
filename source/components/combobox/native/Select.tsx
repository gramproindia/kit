import { useImperativeHandle, useMemo, useRef, type ComponentRef, type Ref } from "react";
import { Text, View } from "react-native";
import { useKitTheme } from "../../shared/native/KitProvider";
import { defaultComboboxText } from "../core/locale";
import type { ComboboxOption, OptionValue } from "../core/types";
import { FieldShell, OptionList, Picker, themed, Trigger } from "./parts";
import { applyStyle, plain, type ComboboxHandle, type ComboboxSharedProps } from "./props";
import { useCombobox } from "./useCombobox";

export interface SelectProps<V extends OptionValue = string> extends ComboboxSharedProps<V> {
  value?: V | null;
  defaultValue?: V | null;
  /** The chosen value and its option; both `null` once cleared. */
  onChange?(value: NoInfer<V> | null, option: ComboboxOption<NoInfer<V>> | null): void;
  /** Close the list after choosing. Default true. */
  closeOnSelect?: boolean;
  ref?: Ref<ComboboxHandle<V>>;
}

/**
 * Single-select: a field that opens a searchable list, as a bottom sheet on a
 * phone and a popover under the field on a tablet.
 */
export function Select<V extends OptionValue = string>(props: SelectProps<V>) {
  const {
    ref,
    value,
    defaultValue,
    onChange,
    closeOnSelect = true,
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
    multiple: false,
    closeOnSelect,
    value: value === undefined ? undefined : value === null ? [] : [value],
    defaultValue: defaultValue === null || defaultValue === undefined ? [] : [defaultValue],
    onValuesChange: (values, selected) => onChange?.(values[0] ?? null, selected[0] ?? null),
  });
  useImperativeHandle(ref, () => combobox.handle, [combobox.handle]);

  const selected = combobox.selectedOptions[0];
  const invalid = error !== undefined && error !== null && error !== false;
  const state = { open: combobox.open, pressed: false, disabled, invalid, size };
  const hint = [plain(error), plain(description)].filter(Boolean).join(". ") || undefined;

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
        accessibilityValue={selected?.label ?? placeholder}
        hint={hint}
        required={required}
        onPress={() => combobox.setOpen(!combobox.open)}
        styles={styles}
        state={state}
        clearLabel={text.clear}
        onClear={clearable && selected && !disabled ? combobox.clear : undefined}
      >
        {selected?.icon}
        <Text
          numberOfLines={1}
          style={[selected ? s.value : s.placeholder, applyStyle(styles?.value, state)]}
        >
          {selected ? selected.label : placeholder}
        </Text>
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
            multiple={false}
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
          />
        )}
      </Picker>
    </FieldShell>
  );
}
