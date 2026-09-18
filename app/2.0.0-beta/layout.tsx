import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getNav } from "./_lib/docs";
import { v2Config } from "./_lib/config";
import { SiteHeader } from "./_components/SiteHeader";
import "./v2.css";

const sans = Geist({ subsets: ["latin"], variable: "--v2-font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--v2-font-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    template: `%s | ${v2Config.name} ${v2Config.version}`,
    default: `${v2Config.name} ${v2Config.version} Docs`,
  },
  description: v2Config.description,
};

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const nav = await getNav();

  return (
    <div className={`v2 ${sans.variable} ${mono.variable}`}>
      <a href="#v2-main" className="v2-skip">
        Skip to content
      </a>
      <SiteHeader nav={nav} />
      {children}
      <footer className="relative z-10 border-t border-(--v2-border) bg-(--v2-bg)">
        <div className="v2-container flex flex-col gap-3 py-8 text-sm text-(--v2-muted) sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Grampro R&amp;D. {v2Config.name} {v2Config.version}.</p>
          <div className="flex gap-5">
            <Link href={v2Config.legacyDocsHref} className="hover:text-(--v2-fg)">
              1.x Docs
            </Link>
            <Link href={v2Config.bugReportHref} className="hover:text-(--v2-fg)">
              Report a bug
            </Link>
            <a href={v2Config.figma} target="_blank" rel="noopener noreferrer" className="hover:text-(--v2-fg)">
              Figma
            </a>
            <a href="/llms.txt" className="hover:text-(--v2-fg)">
              llms.txt
            </a>
            <a href={v2Config.github} target="_blank" rel="noopener noreferrer" className="hover:text-(--v2-fg)">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
