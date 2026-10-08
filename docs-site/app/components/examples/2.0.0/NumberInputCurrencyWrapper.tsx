"use client";

import { useState } from "react";
import { NumberInput } from "@/components/number-input";

export default function NumberInputCurrencyWrapper() {
  const [amount, setAmount] = useState<number | null>(1234.5);
  const [discount, setDiscount] = useState<number | null>(0.15);

  return (
    <div className="flex flex-col gap-3">
      <NumberInput
        label="Amount (en-US)"
        locale="en-US"
        format="currency"
        currency="USD"
        decimals={2}
        value={amount}
        onValueChange={setAmount}
      />
      <NumberInput
        label="Betrag (de-DE)"
        locale="de-DE"
        format="currency"
        currency="EUR"
        decimals={2}
        value={amount}
        onValueChange={setAmount}
      />
      <NumberInput
        label="Montant (fr-FR)"
        locale="fr-FR"
        decimals={2}
        value={amount}
        onValueChange={setAmount}
      />
      <NumberInput
        label="Discount"
        description={`Shown as a percentage, held as ${discount ?? 0}.`}
        format="percent"
        step={0.01}
        min={0}
        max={1}
        value={discount}
        onValueChange={setDiscount}
      />
    </div>
  );
}
