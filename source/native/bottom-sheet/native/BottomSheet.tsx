import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ScrollView,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../../components/shared/native/KitProvider";
import { Sheet } from "../../../components/shared/native/Sheet";
import { useControllableState } from "../../../components/shared/react/useControllableState";

const CloseContext = createContext<(() => void) | null>(null);

const themed = createThemedStyles((t) => ({
  description: {
    fontSize: t.fontSize - 1,
    color: t.muted,
    paddingHorizontal: 16,
    paddingBottom: 8,
    lineHeight: (t.fontSize - 1) * 1.4,
  },
  body: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  footer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: t.borderSubtle,
  },
}));

type Renderable = ReactNode | ((close: () => void) => ReactNode);

export interface BottomSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  /** Pressing it opens the sheet: a Button or any element taking `onPress`. */
  trigger?: ReactElement<{ onPress?(event: GestureResponderEvent): void }>;
  /** Heading, also the sheet's accessible name. */
  title?: ReactNode;
  description?: ReactNode;
  /** Sticky actions under the scrolling content. A function receives `close`. */
  footer?: Renderable;
  /** Tap outside, drag down and Android back close it. Default true. */
  dismissible?: boolean;
  /** Largest height as a fraction of the screen. Default 0.9. */
  maxHeight?: number;
  /** Content scrolls when taller than the sheet. Default true. */
  scrollable?: boolean;
  /** After the exit animation. */
  onClosed?(): void;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ body: StyleProp<ViewStyle>; footer: StyleProp<ViewStyle> }>;
  /** Content. A function receives `close`. */
  children?: Renderable;
}

/**
 * A panel that slides up from the bottom: secondary actions, a short form,
 * details for a tapped item. Drag the handle down, tap outside, or press
 * Android back to close it.
 */
export function BottomSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  dismissible = true,
  maxHeight,
  scrollable = true,
  onClosed,
  style,
  styles: slots,
  children,
}: BottomSheetProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const [open, setOpen] = useControllableState(openProp, defaultOpen);

  const change = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    onOpenChange?.(next);
  };
  const close = () => change(false);
  const render = (node: Renderable | undefined) => (typeof node === "function" ? node(close) : node);

  const body = <View style={[s.body, slots?.body]}>{render(children)}</View>;

  return (
    <CloseContext.Provider value={close}>
      {trigger &&
        isValidElement(trigger) &&
        cloneElement(trigger, {
          onPress: (event: GestureResponderEvent) => {
            trigger.props.onPress?.(event);
            change(true);
          },
        })}
      <Sheet
        open={open}
        onDismiss={close}
        title={title}
        dismissible={dismissible}
        maxHeight={maxHeight}
        onClosed={onClosed}
        style={style}
      >
        {description !== undefined &&
          (typeof description === "string" ? <Text style={s.description}>{description}</Text> : description)}
        {scrollable ? (
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {footer !== undefined && <View style={[s.footer, slots?.footer]}>{render(footer)}</View>}
      </Sheet>
    </CloseContext.Provider>
  );
}

/**
 * Wraps an element so pressing it closes the surrounding BottomSheet, e.g.
 * `<BottomSheetClose><Button>Cancel</Button></BottomSheetClose>`.
 */
export function BottomSheetClose({
  children,
}: {
  children: ReactElement<{ onPress?(event: GestureResponderEvent): void }>;
}) {
  const close = useContext(CloseContext);
  if (!isValidElement(children)) return children;
  return cloneElement(children, {
    onPress: (event: GestureResponderEvent) => {
      children.props.onPress?.(event);
      close?.();
    },
  });
}

/** The surrounding sheet's `close`, for custom content. */
export function useBottomSheetClose(): () => void {
  const close = useContext(CloseContext);
  return close ?? (() => undefined);
}
