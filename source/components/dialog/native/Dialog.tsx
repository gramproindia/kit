import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CheckGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useInsets, useKitTheme } from "../../shared/native/KitProvider";
import { Overlay } from "../../shared/native/Overlay";
import { Ring } from "../../shared/native/primitives";
import { alpha, mix, type KitTokens } from "../../shared/native/theme";
import { defaultDialogText } from "../core/locale";
import type { DialogIntent, DialogKind, DialogLocaleText, PromptOptions } from "../core/types";

export type DialogAction = "confirm" | "cancel";

export type DialogSlot =
  | "root"
  | "body"
  | "icon"
  | "title"
  | "description"
  | "input"
  | "actions"
  | "confirm"
  | "cancel";

export interface DialogProps extends Omit<PromptOptions, "onConfirm"> {
  /** Whether the dialog is on screen. Always controlled: set it to false in `onClose`. */
  open: boolean;
  /** `alert` has one button, `confirm` two, `prompt` adds a text field. Default `confirm`. */
  kind?: DialogKind;
  /**
   * Runs on Confirm, with the prompt's value. While its promise is pending the
   * buttons show progress; if it throws, the error is shown and the dialog stays open.
   */
  onConfirm?(value: string): void | Promise<void>;
  /** The user answered. Set `open` to false here. */
  onClose?(action: DialogAction, value: string): void;
  /** The exit animation finished. */
  onExited?(): void;
  id?: string;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    body: StyleProp<ViewStyle>;
    icon: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    input: StyleProp<TextStyle>;
    actions: StyleProp<ViewStyle>;
    confirm: StyleProp<ViewStyle>;
    cancel: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<DialogLocaleText>;
}

const WIDTH = { sm: 360, md: 420 } as const;

const KEYBOARD: Record<NonNullable<PromptOptions["inputType"]>, "default" | "email-address" | "numeric" | "url" | "phone-pad"> = {
  text: "default",
  email: "email-address",
  password: "default",
  number: "numeric",
  url: "url",
  tel: "phone-pad",
};

function intentColor(t: KitTokens, intent: DialogIntent): string | null {
  switch (intent) {
    case "info":
      return t.info;
    case "success":
      return t.success;
    case "warning":
      return t.warning;
    case "danger":
      return t.danger;
    default:
      return null;
  }
}

const themed = createThemedStyles((t) => ({
  card: {
    backgroundColor: t.raised,
    borderRadius: t.radius + 4,
    borderWidth: 1,
    borderColor: t.border,
    boxShadow: t.shadow,
    overflow: "hidden",
  },
  body: { flexDirection: "row", gap: 14, padding: 20, paddingBottom: 16 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 18, fontWeight: "800" },
  text: { flex: 1, minWidth: 0, gap: 6 },
  title: { fontSize: t.fontSize + 2, fontWeight: "600", color: t.fg, lineHeight: (t.fontSize + 2) * 1.35 },
  description: { fontSize: t.fontSize, color: t.muted, lineHeight: t.fontSize * 1.45 },
  label: { fontSize: t.fontSize - 1, fontWeight: "500", color: t.fg, marginTop: 6 },
  input: {
    minHeight: t.touchTarget,
    marginTop: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: t.radius,
    borderColor: t.borderControl,
    backgroundColor: t.inputBg,
    color: t.fg,
    fontSize: t.fontSize,
  },
  error: { fontSize: t.fontSize - 1, color: t.danger, marginTop: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    minHeight: t.touchTarget,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: t.radius,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: t.fontSize, fontWeight: "600" },
}));

/** Keyboard height, so a prompt's field stays above the keyboard. */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(show, (e) => setHeight(e.endCoordinates.height));
    const b = Keyboard.addListener(hide, () => setHeight(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return height;
}

function IntentIcon({ intent, color }: { intent: DialogIntent; color: string }) {
  const s = themed(useKitTheme().tokens);
  if (intent === "success") return <CheckGlyph size={18} color={color} stroke={2.5} />;
  return <Text style={[s.iconText, { color }]}>{intent === "info" ? "i" : "!"}</Text>;
}

/** An alert, confirm or prompt dialog. For the promise API, mount `<DialogHost />` and call `dialog.confirm()`. */
export function Dialog(props: DialogProps) {
  const {
    open,
    kind = "confirm",
    title,
    description,
    intent = "default",
    icon,
    confirmLabel,
    cancelLabel,
    dismissible = true,
    size = "sm",
    defaultValue = "",
    placeholder,
    inputLabel,
    inputType = "text",
    required = false,
    validate,
    onConfirm,
    onClose,
    onExited,
    id: idProp,
    style,
    styles: slots,
    localeText,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const insets = useInsets();
  const window = useWindowDimensions();
  const keyboard = useKeyboardHeight();
  const reactId = useId();
  const id = idProp ?? reactId;
  const text = useMemo(() => ({ ...defaultDialogText, ...localeText }), [localeText]);

  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Reset each time it opens.
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) {
      setValue(defaultValue);
      setError(null);
      setPending(false);
    }
  }

  const confirm = async () => {
    if (pending || !open) return;
    if (kind === "prompt") {
      const message = required && !value.trim() ? text.required : validate?.(value);
      if (message) {
        setError(message);
        return;
      }
    }
    if (onConfirm) {
      setPending(true);
      setError(null);
      try {
        await onConfirm(value);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
        setPending(false);
        return;
      }
      setPending(false);
    }
    onClose?.("confirm", value);
  };

  const cancel = () => {
    if (pending || !open) return;
    onClose?.("cancel", value);
  };

  const color = intentColor(tokens, intent);
  const resolvedIcon =
    icon !== undefined ? icon : color ? <IntentIcon intent={intent} color={color} /> : null;
  const danger = intent === "danger";
  const fill = danger ? tokens.danger : tokens.accent;
  const ink = danger ? tokens.dangerFg : tokens.accentFg;
  const width = Math.min(WIDTH[size], window.width - insets.left - insets.right - 32);

  const node = (value: ReactNode, style: StyleProp<TextStyle>, nativeID?: string) =>
    typeof value === "string" || typeof value === "number" ? (
      <Text style={style} nativeID={nativeID}>
        {value}
      </Text>
    ) : (
      value
    );

  return (
    <Overlay open={open} onDismiss={dismissible ? cancel : undefined} dismissible={dismissible} onClosed={onExited} duration={200}>
      {(progress) => (
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", paddingBottom: keyboard }]}
        >
          <Animated.View
            role="alertdialog"
            aria-modal
            aria-labelledby={`${id}-title`}
            accessibilityViewIsModal
            style={[
              s.card,
              {
                width,
                opacity: progress,
                transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
              },
              slots?.root,
              style,
            ]}
          >
            <View style={[s.body, slots?.body]}>
              {resolvedIcon != null && (
                <View
                  style={[s.icon, color ? { backgroundColor: alpha(color, 0.14) } : undefined, slots?.icon]}
                  aria-hidden
                >
                  {resolvedIcon}
                </View>
              )}
              <View style={s.text}>
                <Text role="heading" nativeID={`${id}-title`} style={[s.title, slots?.title]}>
                  {title}
                </Text>
                {description != null && node(description, [s.description, slots?.description], `${id}-description`)}
                {kind === "prompt" && (
                  <>
                    {inputLabel != null && node(inputLabel, s.label, `${id}-label`)}
                    <TextInput
                      value={value}
                      onChangeText={(next) => {
                        setValue(next);
                        if (error) setError(null);
                      }}
                      placeholder={placeholder}
                      placeholderTextColor={tokens.muted}
                      secureTextEntry={inputType === "password"}
                      keyboardType={KEYBOARD[inputType]}
                      autoCapitalize={inputType === "text" ? "sentences" : "none"}
                      autoFocus
                      editable={!pending}
                      returnKeyType="done"
                      onSubmitEditing={() => void confirm()}
                      aria-label={typeof inputLabel === "string" ? inputLabel : typeof title === "string" ? title : undefined}
                      aria-invalid={error ? true : undefined}
                      style={[s.input, error ? { borderColor: tokens.danger } : undefined, slots?.input]}
                    />
                  </>
                )}
                {error && (
                  <Text role="alert" aria-live="assertive" style={s.error}>
                    {error}
                  </Text>
                )}
              </View>
            </View>

            <View style={[s.actions, slots?.actions]}>
              {kind !== "alert" && (
                <Pressable
                  role="button"
                  aria-disabled={pending || undefined}
                  onPress={cancel}
                  style={({ pressed }) => [
                    s.button,
                    { borderColor: tokens.border, backgroundColor: pressed ? tokens.hover : "transparent" },
                    slots?.cancel,
                  ]}
                >
                  {node(cancelLabel ?? text.cancel, [s.buttonText, { color: tokens.fg }])}
                </Pressable>
              )}
              <Pressable
                role="button"
                aria-disabled={pending || undefined}
                aria-busy={pending || undefined}
                onPress={() => void confirm()}
                style={({ pressed }) => [
                  s.button,
                  {
                    borderColor: fill,
                    backgroundColor: pressed ? mix(fill, tokens.fg, 0.12) : fill,
                  },
                  slots?.confirm,
                ]}
              >
                {pending && <Ring size={16} color={ink} />}
                {node(confirmLabel ?? (kind === "alert" ? text.ok : text.confirm), [s.buttonText, { color: ink }])}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}
    </Overlay>
  );
}
