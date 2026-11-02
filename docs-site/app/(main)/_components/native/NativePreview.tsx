import type { ReactNode } from "react";
import { PhoneFrame } from "./PhoneFrame";

/**
 * `<NativePreview demo="ButtonDemo">```tsx …```</NativePreview>` in the native
 * docs' MDX: the demo, live, in a phone frame, with its source beside it on
 * wide screens and below it on narrow ones. A server component so MDX can use it.
 */
export function NativePreview({ demo, height, children }: { demo: string; height?: number; children?: ReactNode }) {
  return (
    <div className="v2-native-preview not-prose" data-has-code={children ? "" : undefined}>
      <div className="v2-native-preview-stage">
        <PhoneFrame demo={demo} height={height} />
      </div>
      {children && <div className="v2-native-preview-code">{children}</div>}
    </div>
  );
}
