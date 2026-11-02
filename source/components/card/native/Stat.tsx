import type { ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText } from "../../shared/native/primitives";
import { isPositive, type TrendDirection } from "../core/trend";

export interface StatTrend {
  /** `up`, `down` or `flat`. `trendDirection(change)` works this out for you. */
  direction: TrendDirection;
  /** What is shown beside the arrow, already formatted, e.g. "12.4%". */
  label: ReactNode;
  /** Down is the good outcome for this figure (churn, error rates). Colour only. */
  invert?: boolean;
  /** Read out after the change, e.g. "since last month". */
  description?: ReactNode;
}

export interface StatProps {
  /** What the figure is. Always visible — a number alone means nothing. */
  label: ReactNode;
  value: ReactNode;
  /** The change beside the figure. Left out, no arrow is shown. */
  trend?: StatTrend;
  /** A note under the figure. */
  help?: ReactNode;
  /** An icon beside the label, to identify the metric at a glance. */
  icon?: ReactNode;
  /** Shows placeholder bars instead of the figure. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    value: StyleProp<TextStyle>;
    trend: StyleProp<TextStyle>;
    help: StyleProp<TextStyle>;
    icon: StyleProp<ViewStyle>;
  }>;
}

/** Text glyphs, since there is no SVG: the arrow is also spelled out for screen readers. */
const ARROWS: Record<TrendDirection, string> = { up: "↑", down: "↓", flat: "→" };
const DIRECTION_TEXT: Record<TrendDirection, string> = { up: "Up", down: "Down", flat: "No change" };

const themed = createThemedStyles((t) => ({
  root: { gap: 4 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { fontSize: t.fontSize - 1, fontWeight: "500", color: t.muted },
  icon: { alignItems: "center", justifyContent: "center" },
  value: { fontSize: Math.round(t.fontSize * 1.9), fontWeight: "700", color: t.fg, fontVariant: ["tabular-nums"] },
  trend: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  trendText: { fontSize: t.fontSize - 1, fontWeight: "600" },
  trendDescription: { fontSize: t.fontSize - 1, color: t.muted },
  help: { fontSize: t.fontSize - 1, color: t.muted },
  placeholder: { borderRadius: 4, backgroundColor: t.skeleton },
}));

/**
 * A single figure with its label and, optionally, how it has changed. Put it in
 * a `Card` for a dashboard tile.
 */
export function Stat(props: StatProps) {
  const { label, value, trend, help, icon, loading = false, style, styles: slots } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const positive = trend ? isPositive(trend.direction, trend.invert) : null;
  const trendColor = positive === null ? tokens.muted : positive ? tokens.success : tokens.danger;
  const labelText = typeof label === "string" ? label : undefined;

  return (
    <View style={[s.root, slots?.root, style]} aria-busy={loading || undefined}>
      <View style={s.head}>
        {renderText(label, [s.label, slots?.label])}
        {icon && (
          <View style={[s.icon, slots?.icon]} aria-hidden>
            {icon}
          </View>
        )}
      </View>

      {loading ? (
        <View aria-label="Loading">
          <View style={[s.placeholder, { width: "55%", height: 30, marginVertical: 4 }]} />
          <View style={[s.placeholder, { width: "35%", height: 12 }]} />
        </View>
      ) : (
        <>
          {/* The label names the figure, so "12,480" is read as "Revenue, 12,480". */}
          <View
            aria-label={
              labelText && (typeof value === "string" || typeof value === "number")
                ? `${labelText}, ${value}`
                : undefined
            }
          >
            {renderText(value, [s.value, slots?.value])}
          </View>

          {trend && (
            <View
              style={s.trend}
              aria-label={
                typeof trend.label === "string"
                  ? [DIRECTION_TEXT[trend.direction], trend.label, typeof trend.description === "string" ? trend.description : ""]
                      .filter(Boolean)
                      .join(" ")
                  : undefined
              }
            >
              <Text style={[s.trendText, { color: trendColor }, slots?.trend]} aria-hidden>
                {ARROWS[trend.direction]}
              </Text>
              {renderText(trend.label, [s.trendText, { color: trendColor }, slots?.trend])}
              {trend.description !== undefined && renderText(trend.description, s.trendDescription)}
            </View>
          )}

          {help !== undefined && renderText(help, [s.help, slots?.help])}
        </>
      )}
    </View>
  );
}
