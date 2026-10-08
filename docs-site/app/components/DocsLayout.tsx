import { ReactNode } from "react";
import { DocsSidebar } from "./DocsSidebar";
import { getDocsStructure } from "@/lib/docs";
import { TableOfContents } from "./TableOfContents";
import { ScrollToTop } from "./ScrollToTop";
import OpenInChatGpt from "./OpenInChatGpt";
import { Breadcrumb } from "@/component-lib/breadcrumb";

interface DocsLayoutProps {
  children?: ReactNode;
  content: ReactNode;
  tocItems: any[];
  frontmatter?: any;
}

export async function DocsLayout({ content, tocItems }: DocsLayoutProps) {
  const docsStructure = await getDocsStructure();

  return (
    <div className="flex min-h-screen md:px-10">
      <ScrollToTop />
      <DocsSidebar docsStructure={docsStructure} />
      <main className="flex-1 overflow-x-auto">
        <article className="flex-1 max-w-4xl mx-auto py-12 px-6">
          <div className="flex justify-between items-center">
            <Breadcrumb />
            <OpenInChatGpt />
          </div>
          {content}
        </article>
      </main>
      <TableOfContents items={tocItems} />
    </div>
  );
}
