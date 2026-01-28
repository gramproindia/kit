import { ReactNode } from "react";
import { DocsSidebar } from "@/app/components/DocsSidebar";
import { getDocsStructure } from "@/lib/docs";
import { ScrollToTop } from "@/app/components/ScrollToTop";

export default async function DocsLayout({ children }: { children: ReactNode }) {
  const docsStructure = await getDocsStructure();

  return (
    <div className="flex min-h-screen md:px-10">
      <ScrollToTop />
      <DocsSidebar docsStructure={docsStructure} />
      {children}
    </div>
  );
}
