/**
 * The web avatar colours its initials with CSS `oklch()`, which React Native
 * does not parse. This converts the same OKLCH values to hex, so a person is
 * the same colour on both platforms.
 */
function oklchToHex(l: number, c: number, hueDegrees: number): string {
  const h = (hueDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m1 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s1 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1,
    -1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1,
    -0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1,
  ];
  return (
    "#" +
    linear
      .map((x) => {
        const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
        return Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

/** Fill and text for palette slot `index`, matching `--av-hue: 210 + index * 45`. */
export function avatarColors(index: number, dark: boolean): { fill: string; ink: string } {
  const hue = (210 + index * 45) % 360;
  return dark
    ? { fill: oklchToHex(0.32, 0.06, hue), ink: oklchToHex(0.88, 0.1, hue) }
    : { fill: oklchToHex(0.93, 0.05, hue), ink: oklchToHex(0.42, 0.13, hue) };
}
