import { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

/*
 * The assistants are named explicitly rather than left to the wildcard.
 *
 * `*` already allows them, but a named group takes precedence over `*` for
 * that agent, so a later tightening of the wildcard cannot cut off the
 * crawlers this library is meant to be found by. This documentation exists to
 * be read by models as much as by people - the site publishes llms.txt and a
 * Markdown copy of every page for the same reason.
 */
const ASSISTANTS = [
  "GPTBot", // OpenAI, training and retrieval
  "OAI-SearchBot", // OpenAI, ChatGPT search index
  "ChatGPT-User", // OpenAI, fetching a link a user pasted
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      ...ASSISTANTS.map((userAgent) => ({ userAgent, allow: "/", disallow: "/api/" })),
    ],
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
  };
}
