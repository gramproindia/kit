import Link from "next/link";
import type { NavGroup } from "../_lib/docs";
import { v2Config } from "../_lib/config";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { CommandMenu } from "./CommandMenu";
import { ThemeToggle } from "./ThemeToggle";
import { GitHubIcon } from "./GitHubIcon";

export function SiteHeader({ nav }: { nav: NavGroup[] }) {
  const firstDoc = nav[0]?.items[0];

  return (
    <header className="v2-header">
      <div className="v2-container flex h-14 items-center gap-2 sm:gap-4">
        <MobileNav nav={nav} />
        <Logo />
        <span className="v2-pill">{v2Config.version}</span>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 text-sm lg:flex">
          {firstDoc && (
            <Link href={firstDoc.href} className="v2-top-link">
              Components
            </Link>
          )}
          <Link href={v2Config.legacyDocsHref} className="v2-top-link">
            1.x Docs
          </Link>
          <Link href={v2Config.bugReportHref} className="v2-top-link">
            Report a bug
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CommandMenu />
          <a
            href={v2Config.github}
            target="_blank"
            rel="noopener noreferrer"
            className="v2-icon-btn"
            aria-label="GitHub repository"
          >
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
