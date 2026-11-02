import type { Metadata } from "next";
import { getNativeDocs } from "../../../_lib/native-docs";
import { NativeDocPage, nativeMetadata } from "../../../_components/native/NativeDocPage";

/** /native/docs/<slug>: a guide from app/content/native/, or a component page from native-components.ts. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getNativeDocs()).filter((doc) => doc.slug !== "index").map((doc) => ({ slug: doc.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return nativeMetadata((await params).slug);
}

export default async function NativeDocsPage({ params }: Props) {
  return <NativeDocPage slug={(await params).slug} />;
}
