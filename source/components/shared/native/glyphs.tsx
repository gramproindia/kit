import { View } from "react-native";
import { KitIcon } from "./icons";

/**
 * Small icons drawn with Views, so no SVG library is needed. All are
 * decorative (`aria-hidden`); the control around them carries the label.
 * Each one gives way to the app's icon pack when `KitProvider icons` has an
 * entry for it (see icons.tsx), so every component using them follows.
 */

export interface GlyphProps {
  /** Box size in dp. Default 16. */
  size?: number;
  color: string;
  /** Stroke width. Default size / 8, at least 1.5. */
  stroke?: number;
}

const strokeOf = (size: number, stroke?: number) => stroke ?? Math.max(1.5, size / 8);

/** ×: close, dismiss, clear. */
export function CloseGlyph({ size = 16, color, stroke }: GlyphProps) {
  return <KitIcon name="close" size={size} color={color} fallback={<DrawnClose size={size} color={color} stroke={stroke} />} />;
}

function DrawnClose({ size = 16, color, stroke }: GlyphProps) {
  const w = strokeOf(size, stroke);
  const bar = { position: "absolute" as const, width: size * 0.9, height: w, borderRadius: w, backgroundColor: color };
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

/** Chevron pointing `direction`: disclosure, select, steppers, month paging. */
export function ChevronGlyph({
  size = 16,
  color,
  stroke,
  direction = "down",
}: GlyphProps & { direction?: "up" | "down" | "left" | "right" }) {
  return (
    <KitIcon
      name="chevron"
      size={size}
      color={color}
      direction={direction}
      fallback={<DrawnChevron size={size} color={color} stroke={stroke} direction={direction} />}
    />
  );
}

function DrawnChevron({
  size = 16,
  color,
  stroke,
  direction = "down",
}: GlyphProps & { direction?: "up" | "down" | "left" | "right" }) {
  const w = strokeOf(size, stroke);
  const arm = size * 0.45;
  const rotate = { down: "45deg", up: "-135deg", right: "-45deg", left: "135deg" }[direction];
  const nudge = { down: -arm * 0.25, up: arm * 0.25, right: 0, left: 0 }[direction];
  const nudgeX = { down: 0, up: 0, right: -arm * 0.25, left: arm * 0.25 }[direction];
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View
        style={{
          width: arm,
          height: arm,
          borderRightWidth: w,
          borderBottomWidth: w,
          borderColor: color,
          transform: [{ translateY: nudge }, { translateX: nudgeX }, { rotate }],
        }}
      />
    </View>
  );
}

/** ✓: selected, done. */
export function CheckGlyph({ size = 16, color, stroke }: GlyphProps) {
  return <KitIcon name="check" size={size} color={color} fallback={<DrawnCheck size={size} color={color} stroke={stroke} />} />;
}

function DrawnCheck({ size = 16, color, stroke }: GlyphProps) {
  const w = strokeOf(size, stroke);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View
        style={{
          width: size * 0.32,
          height: size * 0.6,
          marginTop: -size * 0.12,
          borderRightWidth: w,
          borderBottomWidth: w,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}
