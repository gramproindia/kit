import type { Metadata } from "next";
import { NativeDocPage, nativeMetadata } from "../../_components/native/NativeDocPage";

/** /native/docs: the React Native getting-started page, from app/content/native/index.mdx. */
export async function generateMetadata(): Promise<Metadata> {
  return nativeMetadata("index");
}

export default function NativeDocsHome() {
  return <NativeDocPage slug="index" />;
}
