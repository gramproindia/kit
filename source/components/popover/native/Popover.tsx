import {
  cloneElement,
  isValidElement,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  ScrollView,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Anchored, usePresentation } from "../../shared/native/Anchored";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText } from "../../shared/native/primitives";
import { Sheet } from "../../shared/native/Sheet";
import { useControllableState } from "../../shared/react/useControllableState";
import { defaultPopoverText } from "../core/locale";
import type { PopoverAlign, PopoverCloseReason, PopoverLocaleText, PopoverSide } from "../core/types";

export interface PopoverHandle {
  open(): void;
  close(): void;
}

/** Given to `children` when it is a function. */
export interface PopoverRenderProps {
  close(): void;
}

type TriggerProps = {
  ref?: Ref<unknown>;
  onPress?(event: GestureResponderEvent): void;
  [prop: string]: unknown;
};

export interface PopoverProps {
  /**
   * The element that opens it, cloned with a ref (to measure where it is) and
   * an `onPress`. Any Kit button, or any Pressable, works.
   */
  trigger: ReactElement<TriggerProps>;
  children?: ReactNode | ((props: PopoverRenderProps) => ReactNode);
  /** Controlled open state. */
  open?: boolean;
  /** Open to begin with, when you are not controlling `open`. */
  defaultOpen?: boolean;
  /**
   * `reason` is `outside` (tap outside), `escape` (Android back), `trigger`
   * or `api`, and undefined when opening.
   */
  onOpenChange?(open: boolean, reason?: PopoverCloseReason): void;
  /** Heading inside the panel, which also names it. */
  title?: ReactNode;
  /** A line under the title. */
  description?: ReactNode;
  /** Names the panel when there is no `title`. */
  "aria-label"?: string;
  /** Side of the trigger to open on, before flipping for space. Default `bottom`. */
  side?: PopoverSide;
  /** Default `start`. */
  align?: PopoverAlign;
  /** Distance from the trigger, in dp. Default 6. */
  gap?: number;
  /** Cap the panel to the space available and let it scroll. Default false. */
  scrollable?: boolean;
  /**
   * `popover` anchors it to the trigger (default); `sheet` opens a bottom
   * sheet; `auto` picks a sheet on phones and a popover on tablets.
   */
  presentation?: "auto" | "popover" | "sheet";
  /** The panel's style (the web's `className` on the panel). */
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    panel: StyleProp<ViewStyle>;
    header: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    body: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<PopoverLocaleText>;
  ref?: Ref<PopoverHandle>;
}

const WIDTH = 280;

const themed = createThemedStyles((t) => ({
  panel: { width: WIDTH, maxWidth: "100%" },
  header: { paddingHorizontal: 12, paddingTop: 12, gap: 2 },
  sheetHeader: { paddingHorizontal: 16, paddingBottom: 4, gap: 2 },
  title: { fontSize: t.fontSize + 1, fontWeight: "600", color: t.fg },
  description: { fontSize: t.fontSize - 1, color: t.muted, lineHeight: (t.fontSize - 1) * 1.4 },
  body: { padding: 12 },
  sheetBody: { paddingHorizontal: 16, paddingVertical: 12 },
  text: { fontSize: t.fontSize, color: t.fg, lineHeight: t.fontSize * 1.45 },
}));

/** Puts a ref and an `onPress` on the caller's trigger, keeping theirs. */
function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref) (ref as { current: T | null }).current = value;
    }
  };
}

/**
 * A panel anchored to the element that opens it, above everything, so it is
 * never clipped by a scrolling parent. Tap outside or press back to close.
 *
 * For a list of commands use the Menu, and for a short label use the Tooltip.
 * This is for everything else: a filter form, a colour picker, help text too
 * long for a tooltip.
 */
export function Popover(props: PopoverProps) {
  const {
    ref,
    trigger,
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    title,
    description,
    "aria-label": ariaLabel,
    side = "bottom",
    align = "start",
    gap = 6,
    scrollable = false,
    presentation: presentationProp = "popover",
    style,
    styles: slots,
    localeText,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultPopoverText, ...localeText }), [localeText]);
  const presentation = usePresentation(presentationProp);
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [open, setOpenState] = useControllableState(openProp, defaultOpen);

  const setOpen = useCallback(
    (next: boolean, reason?: PopoverCloseReason) => {
      setOpenState(next);
      onOpenChange?.(next, reason);
    },
    [setOpenState, onOpenChange],
  );

  useImperativeHandle(
    ref,
    () => ({ open: () => setOpen(true), close: () => setOpen(false, "api") }),
    [setOpen],
  );

  if (!isValidElement(trigger)) {
    throw new Error("Popover: `trigger` must be a single React element.");
  }

  const close = () => setOpen(false, "api");
  const content = typeof children === "function" ? children({ close }) : children;
  const label = typeof title === "string" ? title : (ariaLabel ?? text.label);
  const triggerProps = trigger.props;

  const clone = cloneElement(trigger, {
    ref: composeRefs(triggerProps.ref, anchorRef),
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    onPress(event: GestureResponderEvent) {
      triggerProps.onPress?.(event);
      if (open) setOpen(false, "trigger");
      else setOpen(true);
    },
  } as Partial<TriggerProps>);

  const header = (title !== undefined || description !== undefined) && (
    <View style={[presentation === "sheet" ? s.sheetHeader : s.header, slots?.header]}>
      {presentation === "popover" && title !== undefined && (
        <View role="heading">{renderText(title, [s.title, slots?.title])}</View>
      )}
      {description !== undefined && renderText(description, [s.description, slots?.description])}
    </View>
  );

  const body = (
    <View style={[presentation === "sheet" ? s.sheetBody : s.body, slots?.body]}>
      {renderText(content, s.text)}
    </View>
  );

  if (presentation === "sheet") {
    return (
      <>
        {clone}
        <Sheet
          open={open}
          onDismiss={() => setOpen(false, "outside")}
          // Android back stands in for the web's Escape key.
          onBack={() => setOpen(false, "escape")}
          title={title}
          style={[slots?.panel, style]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" aria-label={label}>
            {header}
            {body}
          </ScrollView>
        </Sheet>
      </>
    );
  }

  return (
    <>
      {clone}
      <Anchored
        open={open}
        onDismiss={() => setOpen(false, "outside")}
        onBack={() => setOpen(false, "escape")}
        anchorRef={anchorRef}
        side={side}
        align={align}
        gap={gap}
        fitHeight={scrollable}
      >
        <View role="dialog" aria-label={label} style={[s.panel, slots?.panel, style]}>
          {scrollable ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              {header}
              {body}
            </ScrollView>
          ) : (
            <>
              {header}
              {body}
            </>
          )}
        </View>
      </Anchored>
    </>
  );
}
