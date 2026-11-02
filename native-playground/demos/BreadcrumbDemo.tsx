import { useState } from "react";
import { Text } from "react-native";
import { Breadcrumb } from "../../source/components/breadcrumb";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

const TRAIL = [
  { label: "Home", href: "/" },
  { label: "Customers", href: "/customers" },
  { label: "Gramapro India Pvt Ltd", href: "/customers/42" },
  { label: "Invoices", href: "/customers/42/invoices" },
  { label: "INV-2026-0187" },
];

export function BreadcrumbDemo() {
  const { tokens } = useKitTheme();
  const [went, setWent] = useState("—");
  return (
    <>
      <Section title="Breadcrumb">
        <Breadcrumb items={TRAIL} onNavigate={(item) => setWent(item.href ?? "")} />
        <Text style={{ color: tokens.muted }}>Navigated to: {went}</Text>
      </Section>
      <Section title="Breadcrumb · collapsed, small">
        <Breadcrumb items={TRAIL} maxItems={3} size="sm" onNavigate={(item) => setWent(item.href ?? "")} />
      </Section>
    </>
  );
}
