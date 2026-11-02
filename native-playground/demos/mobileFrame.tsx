import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";

/** A framed "mini screen", so screen-level components show inside the scrolling gallery. */
export function MiniScreen({ children, height = 360 }: { children: ReactNode; height?: number }) {
  const { tokens } = useKitTheme();
  return (
    <View
      style={{
        height,
        borderWidth: 1,
        borderColor: tokens.border,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: tokens.bg,
      }}
    >
      {children}
    </View>
  );
}

/** Placeholder list rows for screen content. */
export function FakeRows({ count = 8, prefix = "Invoice" }: { count?: number; prefix?: string }) {
  const { tokens } = useKitTheme();
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: tokens.borderSubtle }}>
          <Text style={{ color: tokens.fg, fontSize: tokens.fontSize }}>{`${prefix} #${1040 + i}`}</Text>
          <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>₹{(i + 3) * 1250} · due in {i + 2} days</Text>
        </View>
      ))}
    </>
  );
}

/** A text glyph icon in the given colour, standing in for an icon set. */
export function TextIcon({ glyph, color, size = 20 }: { glyph: string; color: string; size?: number }) {
  return <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>{glyph}</Text>;
}
