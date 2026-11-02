import { useState } from "react";
import { Text } from "react-native";
import { NumberInput } from "../../source/components/number-input";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

export function NumberInputDemo() {
  const { tokens } = useKitTheme();
  const [amount, setAmount] = useState<number | null>(1234567.5);
  return (
    <>
      <Section title="NumberInput · locales">
        <NumberInput
          label="Amount (en-IN, INR)"
          locale="en-IN"
          format="currency"
          currency="INR"
          decimals={2}
          value={amount}
          onValueChange={setAmount}
          step={100}
          clearable
        />
        <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>Value: {String(amount)}</Text>
        <NumberInput label="Betrag (de-DE)" locale="de-DE" decimals={2} defaultValue={9876.5} />
        <NumberInput label="Discount" format="percent" step={0.05} min={0} max={1} defaultValue={0.15} />
      </Section>

      <Section title="NumberInput · limits and states">
        <NumberInput
          label="Quantity"
          description="1 to 10. Hold + or − to repeat."
          min={1}
          max={10}
          decimals={0}
          defaultValue={1}
          required
        />
        <NumberInput label="Weight" trailing="kg" step={0.1} defaultValue={72.5} snapToStep />
        <NumberInput label="Seats" defaultValue={4} error="Only 3 seats left." />
        <NumberInput label="Locked" defaultValue={42} readOnly />
        <NumberInput label="Disabled" defaultValue={7} disabled size="sm" />
      </Section>
    </>
  );
}
