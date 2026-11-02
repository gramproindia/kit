import { useState } from "react";
import { Alert } from "../../source/components/alert";
import { Button } from "../../source/components/button";
import { Section } from "./layout";

const VARIANTS = ["info", "success", "warning", "danger", "neutral"] as const;

export function AlertDemo() {
  const [shown, setShown] = useState(true);
  return (
    <>
      <Section title="Alert · variants">
        {VARIANTS.map((variant) => (
          <Alert
            key={variant}
            variant={variant}
            title={`${variant[0].toUpperCase()}${variant.slice(1)}`}
            description="A message that stays on the page until the state changes."
          />
        ))}
      </Section>

      <Section title="Alert · small, actions, dismiss">
        <Alert size="sm" variant="success" description="3 rows imported." />
        <Alert size="sm" variant="neutral" icon={false} description="Read-only: this invoice is locked." />
        <Alert
          variant="danger"
          title="Payment declined"
          description="The card ending 4242 was declined by the bank."
          actions={
            <>
              <Button size="sm" variant="danger">Try again</Button>
              <Button size="sm" variant="ghost">Use another card</Button>
            </>
          }
        />
        {shown ? (
          <Alert variant="info" title="Trial ends in 3 days" onDismiss={() => setShown(false)}>
            Upgrade to keep your saved views.
          </Alert>
        ) : (
          <Button size="sm" variant="outline" onPress={() => setShown(true)}>
            Show dismissed alert
          </Button>
        )}
      </Section>
    </>
  );
}
