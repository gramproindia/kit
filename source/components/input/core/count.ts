import { countCharacters } from "../../shared/core/text";

/**
 * Re-exported so the character count a person sees is identical in every
 * control that shows one. The implementation lives in `shared/core/text.ts`.
 */
export { countCharacters };

/**
 * The number a character counter shows. With a `maxLength` it counts what the
 * limit counts — UTF-16 code units, which is how browsers and React Native
 * enforce `maxLength` — so a counter can never read "2 / 10" while typing is
 * already blocked by two emoji. Without a limit it counts characters as a
 * person sees them, where `"👍🏽"` is one.
 */
export function counterValue(text: string, maxLength?: number): number {
  return maxLength !== undefined ? text.length : countCharacters(text);
}
