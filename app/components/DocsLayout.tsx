import { ReactNode } from "react";
import { DocsSidebar } from "./DocsSidebar";
import { getDocsStructure } from "@/lib/docs";

interface DocsLayoutProps {
  children: ReactNode;
}

export async function DocsLayout({ children }: DocsLayoutProps) {
  const docsStructure = await getDocsStructure();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DocsSidebar docsStructure={docsStructure} />
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}
