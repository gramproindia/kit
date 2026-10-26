import type { Metadata } from "next";
import { AgentDocPage, agentMetadata } from "../_components/AgentDocPage";

/** The SE Agent section's landing page, from app/content/se-agent/index.mdx. */
export async function generateMetadata(): Promise<Metadata> {
  return agentMetadata("index");
}

export default function SeAgentHome() {
  return <AgentDocPage slug="index" />;
}
