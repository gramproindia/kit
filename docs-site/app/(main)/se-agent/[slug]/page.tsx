import type { Metadata } from "next";
import { getAgentDocs } from "../../_lib/agent-docs";
import { AgentDocPage, agentMetadata } from "../../_components/AgentDocPage";

/** /se-agent/<slug>, one page per file in app/content/se-agent/. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAgentDocs()).filter((doc) => doc.slug !== "index").map((doc) => ({ slug: doc.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return agentMetadata((await params).slug);
}

export default async function SeAgentPage({ params }: Props) {
  return <AgentDocPage slug={(await params).slug} />;
}
