import { PhoneFrame } from "./PhoneFrame";

/**
 * `<NativePreview demo="ButtonDemo" />` in the native docs' MDX: the demo,
 * live, in a phone frame. A server component wrapper so MDX can use it.
 */
export function NativePreview({ demo, height }: { demo: string; height?: number }) {
  return (
    <div className="my-8 flex justify-center rounded-xl border border-(--v2-border) bg-(--v2-surface) px-4 py-8">
      <PhoneFrame demo={demo} height={height} />
    </div>
  );
}
