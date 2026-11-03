import { Text, View } from "react-native";
import { KitIcon } from "../../shared/native/icons";
import type { FileKind } from "../core/types";

/**
 * Drawn with Views, so no SVG library is needed. All decorative. Upload, pause,
 * play and retry give way to the app's icon pack (`KitProvider icons`); the
 * error mark and file-kind labels are status, not icons, and stay drawn.
 */

function DrawnUpload({ color, size = 24 }: { color: string; size?: number }) {
  const w = Math.max(2, size / 12);
  return (
    <View style={{ width: size, height: size, alignItems: "center" }} aria-hidden>
      {/* Arrow head */}
      <View
        style={{
          marginTop: size * 0.1,
          width: size * 0.42,
          height: size * 0.42,
          borderLeftWidth: w,
          borderTopWidth: w,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      {/* Shaft */}
      <View style={{ position: "absolute", top: size * 0.14, width: w, height: size * 0.5, backgroundColor: color }} />
      {/* Tray */}
      <View
        style={{
          position: "absolute",
          bottom: size * 0.06,
          width: size * 0.8,
          height: size * 0.22,
          borderLeftWidth: w,
          borderRightWidth: w,
          borderBottomWidth: w,
          borderColor: color,
          borderBottomLeftRadius: w,
          borderBottomRightRadius: w,
        }}
      />
    </View>
  );
}

function DrawnPause({ color, size = 14 }: { color: string; size?: number }) {
  const bar = { width: size * 0.28, height: size * 0.8, borderRadius: 1, backgroundColor: color };
  return (
    <View style={{ width: size, height: size, flexDirection: "row", gap: size * 0.2, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View style={bar} />
      <View style={bar} />
    </View>
  );
}

function DrawnPlay({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View
        style={{
          marginLeft: size * 0.15,
          width: 0,
          height: 0,
          borderTopWidth: size * 0.42,
          borderBottomWidth: size * 0.42,
          borderLeftWidth: size * 0.7,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: color,
        }}
      />
    </View>
  );
}

function DrawnRetry({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Text aria-hidden style={{ color, fontSize: size + 2, lineHeight: size + 4, fontWeight: "700" }}>
      ↻
    </Text>
  );
}

export function AlertGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <View
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color, fontSize: size * 0.65, lineHeight: size * 0.8, fontWeight: "800" }}>!</Text>
    </View>
  );
}

const KIND_LABEL: Record<FileKind, string> = {
  image: "IMG",
  video: "VID",
  audio: "AUD",
  pdf: "PDF",
  spreadsheet: "XLS",
  document: "DOC",
  archive: "ZIP",
  other: "FILE",
};

/** A short label standing in for the web's per-kind file icons. */
export function KindLabel({ kind, color }: { kind: FileKind; color: string }) {
  return (
    <Text aria-hidden style={{ color, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
      {KIND_LABEL[kind]}
    </Text>
  );
}

export function UploadGlyph({ color, size = 24 }: { color: string; size?: number }) {
  return <KitIcon name="upload" size={size} color={color} fallback={<DrawnUpload color={color} size={size} />} />;
}

export function PauseGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return <KitIcon name="pause" size={size} color={color} fallback={<DrawnPause color={color} size={size} />} />;
}

export function PlayGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return <KitIcon name="play" size={size} color={color} fallback={<DrawnPlay color={color} size={size} />} />;
}

export function RetryGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return <KitIcon name="retry" size={size} color={color} fallback={<DrawnRetry color={color} size={size} />} />;
}
