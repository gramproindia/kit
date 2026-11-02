import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  Image,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { mix } from "../../shared/native/theme";
import { colorIndex, initials as toInitials, splitGroup } from "../core/identity";
import { defaultAvatarText } from "../core/locale";
import type { AvatarLocaleText, AvatarShape, AvatarSize, AvatarStatus } from "../core/types";
import { avatarColors } from "./hue";

export type AvatarSlot = "root" | "image" | "fallback" | "status";
export type AvatarGroupSlot = "root" | "overflow";

/** Hues spread around the wheel, as on the web. */
const PALETTE = 8;

const SIZES: Record<AvatarSize, { box: number; font: number }> = {
  xs: { box: 20, font: 10 },
  sm: { box: 24, font: 11 },
  md: { box: 32, font: 13 },
  lg: { box: 40, font: 15 },
  xl: { box: 56, font: 20 },
};

/** A group's size and shape reach the avatars inside it, unless one sets its own. */
const GroupContext = createContext<{ size?: AvatarSize; shape?: AvatarShape; ring?: string } | null>(null);

const themed = createThemedStyles((t) => ({
  root: { alignItems: "center", justifyContent: "center", backgroundColor: t.subtle },
  fill: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  letters: { fontWeight: "600" },
  status: {
    position: "absolute",
    right: 0,
    bottom: 0,
    minWidth: 8,
    minHeight: 8,
    borderWidth: 2,
    borderColor: t.bg,
    backgroundColor: t.muted,
  },
  group: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  overflow: { alignItems: "center", justifyContent: "center", backgroundColor: t.subtle },
  overflowText: { fontWeight: "600", color: mix(t.muted, t.fg, 0.35), fontVariant: ["tabular-nums"] },
}));

export interface AvatarProps extends Omit<ViewProps, "children" | "style"> {
  /** The person or thing: the accessible name, the initials and the colour. */
  name?: string;
  /** The image. If it fails to load, the avatar falls back to the initials. */
  src?: string;
  /** Overrides the text derived from `name`. */
  initials?: string;
  /** An icon or anything else to show instead of initials. */
  children?: ReactNode;
  /** Default `md` (32dp). */
  size?: AvatarSize;
  /** Default `circle`. */
  shape?: AvatarShape;
  /** A presence dot in the corner. */
  status?: AvatarStatus;
  /** Marks the avatar as decoration, for a name printed next to it. */
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    image: StyleProp<ImageStyle>;
    fallback: StyleProp<TextStyle>;
    status: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<AvatarLocaleText>;
  ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * A person in a small square or circle: their picture, or the letters of their
 * name on a colour derived from it. A failed image falls back to the letters.
 */
export function Avatar(props: AvatarProps) {
  const group = useContext(GroupContext);
  const {
    ref,
    name = "",
    src,
    initials: initialsProp,
    children,
    size = group?.size ?? "md",
    shape = group?.shape ?? "circle",
    status,
    decorative = false,
    style,
    styles: slots,
    localeText,
    ...rest
  } = props;

  const { tokens, scheme } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultAvatarText, ...localeText }), [localeText]);
  const [failed, setFailed] = useState(false);
  const letters = initialsProp ?? toInitials(name);
  const showImage = Boolean(src) && !failed;
  const { box, font } = SIZES[size];
  const radius = shape === "square" ? tokens.radius : box / 2;
  const colors = avatarColors(colorIndex(name || letters, PALETTE), scheme === "dark");
  const dot = Math.max(8, Math.round(box * 0.3));
  // The status is a fact about the person, so it joins the spoken name.
  const spoken = [name, status ? text.status[status] : ""].filter(Boolean).join(", ");

  return (
    <View
      {...rest}
      ref={ref}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : spoken || undefined}
      aria-hidden={decorative || undefined}
      style={[
        s.root,
        { width: box, height: box, borderRadius: radius },
        group?.ring && { borderWidth: 2, borderColor: group.ring, width: box + 4, height: box + 4, borderRadius: radius + 2 },
        slots?.root,
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: src }}
          onError={() => setFailed(true)}
          style={[{ width: box, height: box, borderRadius: radius }, slots?.image]}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[s.fill, { borderRadius: radius, backgroundColor: colors.fill }]} aria-hidden>
          {children ?? (
            <Text style={[s.letters, { fontSize: font, color: colors.ink }, slots?.fallback]} numberOfLines={1}>
              {letters}
            </Text>
          )}
        </View>
      )}

      {status && (
        <View
          aria-hidden
          style={[
            s.status,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              right: shape === "square" ? -2 : 0,
              bottom: shape === "square" ? -2 : 0,
            },
            status === "online" && { backgroundColor: tokens.success },
            status === "away" && { backgroundColor: tokens.warning },
            status === "busy" && { backgroundColor: tokens.danger },
            slots?.status,
          ]}
        />
      )}
    </View>
  );
}

export interface AvatarGroupProps {
  children: ReactNode;
  /** How many slots there are, the overflow bubble included. Default 4. */
  max?: number;
  /** Applied to the group; each Avatar keeps its own if it sets one. */
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Names the set, e.g. "Assigned to". */
  label?: string;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ root: StyleProp<ViewStyle>; overflow: StyleProp<ViewStyle> }>;
  localeText?: Partial<AvatarLocaleText>;
  ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * Overlapping avatars with a "+3" at the end. The bubble takes one of the
 * `max` slots, so five people with `max={4}` show three faces and "+2".
 */
export function AvatarGroup(props: AvatarGroupProps) {
  const { ref, children, max = 4, size = "md", shape = "circle", label, style, styles: slots, localeText } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultAvatarText, ...localeText }), [localeText]);
  const { shown, overflow } = splitGroup(Children.toArray(children), max);
  const { box, font } = SIZES[size];
  // Each face overlaps the one before by a quarter and is ringed in the page colour.
  const overlap = -Math.round(box / 4);
  const radius = shape === "square" ? tokens.radius : box / 2;
  const context = useMemo(() => ({ size, shape, ring: tokens.bg }), [size, shape, tokens.bg]);

  return (
    <GroupContext.Provider value={context}>
      <View ref={ref} role="group" aria-label={label} style={[s.group, slots?.root, style]}>
        {shown.map((child, index) =>
          isValidElement(child) ? (
            cloneElement(child as ReactElement<AvatarProps>, {
              style: [index > 0 && { marginStart: overlap }, (child as ReactElement<AvatarProps>).props.style],
            })
          ) : (
            child
          ),
        )}
        {overflow > 0 && (
          <View
            role="img"
            aria-label={text.more(overflow)}
            style={[
              s.overflow,
              {
                width: box + 4,
                height: box + 4,
                borderRadius: radius + 2,
                borderWidth: 2,
                borderColor: tokens.bg,
                marginStart: shown.length > 0 ? overlap : 0,
              },
              slots?.overflow,
            ]}
          >
            <Text style={[s.overflowText, { fontSize: font - 1 }]}>+{overflow}</Text>
          </View>
        )}
      </View>
    </GroupContext.Provider>
  );
}
