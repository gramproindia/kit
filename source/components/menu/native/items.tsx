import { use, useMemo, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { CheckGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText } from "../../shared/native/primitives";
import { MenuRadioContext, useMenuContext, type MenuContextValue } from "./context";

export const menuStyles = createThemedStyles((t) => ({
  list: { padding: 4, minWidth: 180, maxWidth: 320 },
  sheetList: { paddingBottom: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  sheetItem: { minHeight: t.touchTarget + 4, paddingHorizontal: 16, borderRadius: 0, gap: 14 },
  label: { flexShrink: 1, flexGrow: 1, fontSize: t.fontSize, color: t.fg },
  shortcut: { fontSize: t.fontSize - 2, color: t.muted, marginStart: 12 },
  icon: { alignItems: "center", justifyContent: "center", minWidth: 18 },
  indicator: { width: 18, alignItems: "center", justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent },
  groupLabel: {
    fontSize: t.fontSize - 2,
    fontWeight: "600",
    color: t.muted,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 2,
  },
  sheetGroupLabel: { paddingHorizontal: 16, paddingTop: 12 },
  separator: { height: 1, backgroundColor: t.border, marginVertical: 4 },
}));

interface RowProps {
  menu: MenuContextValue;
  role: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  checked?: boolean;
  disabled: boolean;
  destructive?: boolean;
  indicator?: ReactNode;
  icon?: ReactNode;
  label: ReactNode;
  shortcut?: ReactNode;
  trailing?: ReactNode;
  accessibilityLabel?: string;
  expanded?: boolean;
  onPress(): void;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof View>>;
}

// React Native has no menuitemcheckbox/menuitemradio roles; checkbox and radio
// carry the checked state to screen readers, which is what matters.
const NATIVE_ROLE = { menuitem: "menuitem", menuitemcheckbox: "checkbox", menuitemradio: "radio" } as const;

/** One row of a menu, shared by every item kind. */
export function MenuRow({
  menu,
  role,
  checked,
  disabled,
  destructive = false,
  indicator,
  icon,
  label,
  shortcut,
  trailing,
  accessibilityLabel,
  expanded,
  onPress,
  style,
  ref,
}: RowProps) {
  const { tokens } = useKitTheme();
  const s = menuStyles(tokens);
  const sheet = menu.presentation === "sheet";
  const color = disabled ? tokens.muted : destructive ? tokens.danger : tokens.fg;
  return (
    <Pressable
      ref={ref}
      role={NATIVE_ROLE[role]}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-expanded={expanded}
      aria-label={accessibilityLabel}
      // Disabled rows stay visible and reachable, so the action is discoverable.
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        s.item,
        sheet && s.sheetItem,
        pressed && !disabled && { backgroundColor: tokens.hover },
        menu.styles?.item,
        style,
      ]}
    >
      {indicator !== undefined && <View style={[s.indicator, menu.styles?.indicator]}>{indicator}</View>}
      {icon !== undefined && (
        <View style={[s.icon, menu.styles?.icon, disabled && { opacity: 0.5 }]} aria-hidden>
          {icon}
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        {renderText(label, [s.label, { color }, menu.styles?.label], 2)}
      </View>
      {shortcut !== undefined && renderText(shortcut, [s.shortcut, menu.styles?.shortcut], 1)}
      {trailing}
    </Pressable>
  );
}

interface BaseItemProps {
  children: ReactNode;
  /** Drawn before the label. */
  icon?: ReactNode;
  /** A hint such as ⌘K, for hardware keyboards. The menu shows it; binding the key is up to you. */
  shortcut?: ReactNode;
  disabled?: boolean;
  /** Styles it as a destructive action. */
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface MenuItemProps extends BaseItemProps {
  /** Called when the item is chosen. */
  onSelect?(): void;
  /** Keep the menu open after choosing. Defaults to the Menu's `closeOnSelect`. */
  closeOnSelect?: boolean;
}

export function MenuItem(props: MenuItemProps) {
  const { children, icon, shortcut, disabled = false, destructive = false, onSelect, closeOnSelect, style } = props;
  const menu = useMenuContext("MenuItem");
  return (
    <MenuRow
      menu={menu}
      role="menuitem"
      disabled={disabled}
      destructive={destructive}
      icon={icon}
      label={children}
      shortcut={shortcut}
      style={style}
      onPress={() => {
        onSelect?.();
        if (closeOnSelect ?? menu.closeOnSelect) menu.close("select");
      }}
    />
  );
}

export interface MenuCheckboxItemProps extends BaseItemProps {
  /** Ticked (controlled). */
  checked?: boolean;
  /** The state after a toggle. */
  onCheckedChange?(checked: boolean): void;
  /** Default false: toggling several options in a row is the usual case. */
  closeOnSelect?: boolean;
}

export function MenuCheckboxItem(props: MenuCheckboxItemProps) {
  const {
    children,
    icon,
    shortcut,
    checked = false,
    onCheckedChange,
    disabled = false,
    destructive = false,
    closeOnSelect = false,
    style,
  } = props;
  const menu = useMenuContext("MenuCheckboxItem");
  const { tokens } = useKitTheme();
  return (
    <MenuRow
      menu={menu}
      role="menuitemcheckbox"
      checked={checked}
      disabled={disabled}
      destructive={destructive}
      indicator={checked ? <CheckGlyph size={16} color={disabled ? tokens.muted : tokens.accent} /> : null}
      icon={icon}
      label={children}
      shortcut={shortcut}
      style={style}
      onPress={() => {
        onCheckedChange?.(!checked);
        if (closeOnSelect) menu.close("select");
      }}
    />
  );
}

export interface MenuRadioGroupProps {
  /** The chosen value (controlled). */
  value?: string;
  /** The newly chosen value. */
  onValueChange?(value: string): void;
  /** Names the group, and is shown above it when it is a string. */
  label?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function MenuRadioGroup({ value, onValueChange, label, children, style }: MenuRadioGroupProps) {
  const menu = useMenuContext("MenuRadioGroup");
  const context = useMemo(
    () => ({ value, select: (next: string) => onValueChange?.(next) }),
    [value, onValueChange],
  );
  return (
    <MenuRadioContext value={context}>
      <GroupFrame menu={menu} label={label} role="radiogroup" style={style}>
        {children}
      </GroupFrame>
    </MenuRadioContext>
  );
}

export interface MenuRadioItemProps extends BaseItemProps {
  value: string;
  /** Default false, so a list of choices can be tried without reopening. */
  closeOnSelect?: boolean;
}

export function MenuRadioItem(props: MenuRadioItemProps) {
  const { children, icon, shortcut, value, disabled = false, closeOnSelect = false, style } = props;
  const menu = useMenuContext("MenuRadioItem");
  const { tokens } = useKitTheme();
  const s = menuStyles(tokens);
  const group = use(MenuRadioContext);
  if (!group) throw new Error("MenuRadioItem must be rendered inside a <MenuRadioGroup>.");
  const checked = group.value === value;
  return (
    <MenuRow
      menu={menu}
      role="menuitemradio"
      checked={checked}
      disabled={disabled}
      indicator={checked ? <View style={[s.dot, disabled && { backgroundColor: tokens.muted }]} /> : null}
      icon={icon}
      label={children}
      shortcut={shortcut}
      style={style}
      onPress={() => {
        group.select(value);
        if (closeOnSelect) menu.close("select");
      }}
    />
  );
}

function GroupFrame({
  menu,
  label,
  role,
  style,
  children,
}: {
  menu: MenuContextValue;
  label?: ReactNode;
  role: "group" | "radiogroup";
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { tokens } = useKitTheme();
  const s = menuStyles(tokens);
  return (
    <View
      role={role}
      aria-label={typeof label === "string" ? label : undefined}
      style={[menu.styles?.group, style]}
    >
      {label !== undefined &&
        (typeof label === "string" ? (
          <Text
            style={[s.groupLabel, menu.presentation === "sheet" && s.sheetGroupLabel, menu.styles?.groupLabel]}
            aria-hidden
          >
            {label}
          </Text>
        ) : (
          label
        ))}
      {children}
    </View>
  );
}

export interface MenuGroupProps {
  label?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A titled section. The title is a label, not an item. */
export function MenuGroup({ label, children, style }: MenuGroupProps) {
  const menu = useMenuContext("MenuGroup");
  return (
    <GroupFrame menu={menu} label={label} role="group" style={style}>
      {children}
    </GroupFrame>
  );
}

export function MenuSeparator({ style }: { style?: StyleProp<ViewStyle> }) {
  const menu = useMenuContext("MenuSeparator");
  const { tokens } = useKitTheme();
  const s = menuStyles(tokens);
  return <View role="separator" style={[s.separator, menu.styles?.separator, style]} />;
}
