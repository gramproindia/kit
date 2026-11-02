import { View } from "react-native";

// Drawn with Views rather than SVG, so no SVG library is needed.

/** Two crossed bars. */
export function XIcon({ color, size = 14 }: { color: string; size?: number }) {
  const bar = { position: "absolute" as const, width: size, height: 1.75, borderRadius: 1, backgroundColor: color };
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

/** An eye: an outlined lens and a pupil; `crossed` adds a slash for "hide". */
export function EyeIcon({ color, size = 18, crossed = false }: { color: string; size?: number; crossed?: boolean }) {
  const height = Math.round(size * 0.62);
  const pupil = Math.round(size * 0.3);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View
        style={{
          width: size,
          height,
          borderRadius: height,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ width: pupil, height: pupil, borderRadius: pupil / 2, backgroundColor: color }} />
      </View>
      {crossed && (
        <View
          style={{
            position: "absolute",
            width: size * 1.15,
            height: 1.75,
            borderRadius: 1,
            backgroundColor: color,
            transform: [{ rotate: "-40deg" }],
          }}
        />
      )}
    </View>
  );
}
