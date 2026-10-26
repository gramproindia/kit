"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { agentConfig, type AgentNavGroup } from "../_lib/agent-config";

/**
 * The sidebar for the SE Agent pages. Same markup and classes as the component
 * sidebar, so the section reads as part of the site; its own list, because
 * the agent is a separate product with its own pages.
 */
export function AgentSidebarNav({ nav, onNavigate }: { nav: AgentNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label={`${agentConfig.name} documentation`} className="space-y-7 text-sm">
      {nav.map((group) => (
        <div key={group.name}>
          <p className="v2-nav-heading">{group.name}</p>
          <ul className="v2-nav-list">
            {group.items.map((doc) => (
              <li key={doc.href}>
                <Link
                  href={doc.href}
                  onClick={onNavigate}
                  aria-current={pathname === doc.href ? "page" : undefined}
                  className="v2-nav-link"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <p className="v2-nav-heading">Resources</p>
        <ul className="v2-nav-list">
          <li>
            <a href={agentConfig.repo} target="_blank" rel="noopener noreferrer" className="v2-nav-link" onClick={onNavigate}>
              Source on GitHub
            </a>
          </li>
          <li>
            <a href={agentConfig.pdf} download className="v2-nav-link" onClick={onNavigate}>
              Plain-English guide (PDF)
            </a>
          </li>
          <li>
            <Link href="/" className="v2-nav-link" onClick={onNavigate}>
              GramproKit components
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
