import { DocsLayout } from "@/app/components/DocsLayout";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout>{children}</DocsLayout>;
}
