import {
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  type ReactNode,
  type Ref,
} from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CloseGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useInsets, useKitTheme } from "../../shared/native/KitProvider";
import { Overlay } from "../../shared/native/Overlay";
import { Sheet } from "../../shared/native/Sheet";
import { useControllableState } from "../../shared/react/useControllableState";
import { canDismiss, confirmClose } from "../core/dismiss";
import { defaultModalText } from "../core/locale";
import type { CloseReason, ModalLocaleText, ModalPlacement, ModalSize } from "../core/types";

export type ModalSlot = "root" | "header" | "title" | "description" | "close" | "body" | "footer";

export interface ModalHandle {
  open(): void;
  /** Asks to close; `onBeforeClose` still gets a say. */
  close(): void;
}

/** Passed to `children` and `footer` when they are functions. */
export interface ModalRenderProps {
  /** Closes through `onBeforeClose`, like the close button. */
  close(): void;
}

/** What `style` callbacks receive: the native stand-in for `data-*`. */
export interface ModalStyleState {
  open: boolean;
  size: ModalSize;
  placement: ModalPlacement;
}

type Renderable = ReactNode | ((props: ModalRenderProps) => ReactNode);

export interface ModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Open to begin with, when you are not controlling `open`. */
  defaultOpen?: boolean;
  /** `reason` says what closed it; it is undefined when opening. Android back reports `escape`. */
  onOpenChange?(open: boolean, reason?: CloseReason): void;
  title?: ReactNode;
  /** A line under the title. */
  description?: ReactNode;
  /** Accessible name when there is no `title`. */
  "aria-label"?: string;
  children?: Renderable;
  /** The actions row, pinned below the scrolling content. */
  footer?: Renderable;
  /** Width for dialogs; for drawers, the width (left/right). Default `md`. */
  size?: ModalSize;
  /** Default `center`. `bottom` is a bottom sheet with a drag handle. */
  placement?: ModalPlacement;
  /** Show the × button. Default true. */
  closeButton?: boolean;
  /** Android back closes. Named after the web's Escape key, which it stands in for. Default true. */
  closeOnEscape?: boolean;
  /** Default true. */
  closeOnBackdrop?: boolean;
  /** Return `false` (or a promise of it) to keep the modal open, e.g. for unsaved changes. */
  onBeforeClose?(reason: CloseReason): boolean | Promise<boolean>;
  id?: string;
  style?: StyleProp<ViewStyle> | ((state: ModalStyleState) => StyleProp<ViewStyle>);
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    header: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    close: StyleProp<ViewStyle>;
    body: StyleProp<ViewStyle>;
    footer: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<ModalLocaleText>;
  ref?: Ref<ModalHandle>;
}

const WIDTH: Record<ModalSize, number> = { sm: 400, md: 520, lg: 720, xl: 960, full: Infinity };
const GUTTER = 16;

const themed = createThemedStyles((t) => ({
  card: {
    backgroundColor: t.raised,
    borderRadius: t.radius + 4,
    borderWidth: 1,
    borderColor: t.border,
    boxShadow: t.shadow,
    overflow: "hidden",
  },
  drawer: { backgroundColor: t.raised, boxShadow: t.shadow, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingTop: 16, paddingBottom: 12, paddingLeft: 20, paddingRight: 12 },
  heading: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: t.fontSize + 3, fontWeight: "600", color: t.fg, lineHeight: (t.fontSize + 3) * 1.35 },
  description: { fontSize: t.fontSize, color: t.muted, lineHeight: t.fontSize * 1.45 },
  close: { width: 36, height: 36, marginTop: -6, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: t.border,
  },
  text: { fontSize: t.fontSize, color: t.fg, lineHeight: t.fontSize * 1.45 },
}));

/**
 * A modal on Kit's overlay layer: a centred dialog, a drawer from the left or
 * right, or a bottom sheet. Android back and the backdrop follow the same
 * dismiss rules as the web modal, and `onBeforeClose` can keep it open.
 */
export function Modal(props: ModalProps) {
  const {
    ref,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    title,
    description,
    "aria-label": ariaLabel,
    children,
    footer,
    size = "md",
    placement = "center",
    closeButton = true,
    closeOnEscape = true,
    closeOnBackdrop = true,
    onBeforeClose,
    id: idProp,
    style,
    styles: slots,
    localeText,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const insets = useInsets();
  const window = useWindowDimensions();
  const reactId = useId();
  const id = idProp ?? reactId;
  const text = useMemo(() => ({ ...defaultModalText, ...localeText }), [localeText]);
  const [open, setOpenState] = useControllableState(openProp, defaultOpen);

  const setOpen = useCallback(
    (next: boolean, reason?: CloseReason) => {
      setOpenState(next);
      onOpenChange?.(next, reason);
    },
    [setOpenState, onOpenChange],
  );

  const requestClose = useCallback(
    (reason: CloseReason) => {
      if (!canDismiss(reason, { closeOnEscape, closeOnBackdrop })) return;
      void confirmClose(onBeforeClose, reason).then((allowed) => {
        if (allowed) setOpen(false, reason);
      });
    },
    [closeOnEscape, closeOnBackdrop, onBeforeClose, setOpen],
  );

  useImperativeHandle(ref, () => ({ open: () => setOpen(true), close: () => requestClose("api") }), [
    setOpen,
    requestClose,
  ]);

  const renderProps: ModalRenderProps = { close: () => requestClose("api") };
  const render = (node: Renderable) => {
    const value = typeof node === "function" ? node(renderProps) : node;
    return typeof value === "string" || typeof value === "number" ? <Text style={s.text}>{value}</Text> : value;
  };
  const state: ModalStyleState = { open, size, placement };
  const rootStyle = typeof style === "function" ? style(state) : style;
  const hasHeader = title != null || description != null || closeButton;

  const header = hasHeader && (
    <View style={[s.header, slots?.header]}>
      <View style={s.heading}>
        {title != null &&
          (typeof title === "string" ? (
            <Text role="heading" nativeID={`${id}-title`} style={[s.title, slots?.title]}>
              {title}
            </Text>
          ) : (
            <View role="heading">{title}</View>
          ))}
        {description != null &&
          (typeof description === "string" ? (
            <Text nativeID={`${id}-description`} style={[s.description, slots?.description]}>
              {description}
            </Text>
          ) : (
            description
          ))}
      </View>
      {closeButton && (
        <Pressable
          role="button"
          aria-label={text.close}
          hitSlop={4}
          onPress={() => requestClose("close-button")}
          style={({ pressed }) => [s.close, pressed && { backgroundColor: tokens.hover }, slots?.close]}
        >
          <CloseGlyph size={14} color={tokens.muted} />
        </Pressable>
      )}
    </View>
  );

  const content = (
    <>
      {header}
      <ScrollView
        style={{ flexGrow: 0, flexShrink: 1 }}
        contentContainerStyle={[s.body, !hasHeader && { paddingTop: 20 }, slots?.body]}
        keyboardShouldPersistTaps="handled"
      >
        {render(children)}
      </ScrollView>
      {footer != null && <View style={[s.footer, slots?.footer]}>{render(footer)}</View>}
    </>
  );

  const a11y = {
    role: "dialog" as const,
    "aria-modal": true,
    "aria-labelledby": title != null ? `${id}-title` : undefined,
    "aria-label": title == null ? ariaLabel : undefined,
    accessibilityViewIsModal: true,
  };

  // A bottom drawer is the shared Sheet: drag handle, keyboard and safe area included.
  if (placement === "bottom") {
    return (
      <Sheet
        open={open}
        // Backdrop taps and drags report "backdrop"; Android back is the web's
        // Escape, so it reports "escape" and follows closeOnEscape instead.
        onDismiss={() => requestClose("backdrop")}
        onBack={() => requestClose("escape")}
        dismissible={closeOnBackdrop}
        style={[slots?.root, rootStyle]}
      >
        <View {...a11y} style={{ flexShrink: 1 }}>
          {content}
        </View>
      </Sheet>
    );
  }

  const full = size === "full";
  const drawer = placement === "left" || placement === "right";
  const usable = {
    width: window.width - insets.left - insets.right,
    height: window.height - insets.top - insets.bottom,
  };
  const gutter = full || drawer ? 0 : GUTTER;
  const width = drawer
    ? Math.min(WIDTH[size] === Infinity ? window.width : WIDTH[size] * 0.75, window.width * 0.88)
    : Math.min(WIDTH[size], usable.width - gutter * 2);

  return (
    <Overlay
      open={open}
      // The Overlay reports Android back here: the web's Escape, with its own rule.
      onDismiss={() => requestClose("escape")}
      // Backdrop taps are caught below instead, so they report "backdrop".
      dismissible={false}
      duration={200}
    >
      {(progress) => (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => requestClose("backdrop")}
            accessible={false}
            importantForAccessibility="no"
          />
          <View
            pointerEvents="box-none"
            style={{
              flex: 1,
              paddingTop: full || drawer ? 0 : insets.top + gutter,
              paddingBottom: full || drawer ? 0 : insets.bottom + gutter,
              alignItems: drawer ? (placement === "left" ? "flex-start" : "flex-end") : "center",
              justifyContent: placement === "top" ? "flex-start" : "center",
            }}
          >
            <Animated.View
              {...a11y}
              style={[
                drawer || full ? s.drawer : s.card,
                {
                  width,
                  maxHeight: drawer || full ? undefined : usable.height - gutter * 2,
                  height: drawer || full ? "100%" : undefined,
                  marginTop: placement === "top" ? Math.min(window.height * 0.1, 80) : 0,
                  paddingTop: drawer || full ? insets.top : 0,
                  paddingBottom: drawer || full ? insets.bottom : 0,
                  opacity: drawer ? 1 : progress,
                  transform: drawer
                    ? [
                        {
                          translateX: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [placement === "left" ? -width : width, 0],
                          }),
                        },
                      ]
                    : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                },
                slots?.root,
                rootStyle,
              ]}
            >
              {content}
            </Animated.View>
          </View>
        </>
      )}
    </Overlay>
  );
}
