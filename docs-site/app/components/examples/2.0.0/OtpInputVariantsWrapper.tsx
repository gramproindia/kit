"use client";

import { useState } from "react";
import { OtpInput } from "@/components/input";
import { button } from "./_fields-fixtures";

export default function OtpInputVariantsWrapper() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "ok" | "wrong">(
    "idle",
  );

  return (
    <div className="flex flex-col gap-5">
      <OtpInput
        label="SMS code"
        groups={[3, 3]}
        value={code}
        onValueChange={(next) => {
          setCode(next);
          setState("idle");
        }}
        onComplete={(next) => {
          setState("checking");
          setTimeout(() => setState(next === "123456" ? "ok" : "wrong"), 600);
        }}
        disabled={state === "checking"}
        error={
          state === "wrong"
            ? "Wrong code. The demo code is 123456."
            : undefined
        }
        description={
          state === "checking"
            ? "Checking…"
            : state === "ok"
              ? "Verified ✓"
              : "The demo code is 123456."
        }
      />
      <OtpInput
        label="Backup code"
        length={8}
        mode="alphanumeric"
        uppercase
        groups={[4, 4]}
        size="sm"
      />
      <OtpInput label="PIN" length={4} mask size="lg" />
      <button
        type="button"
        className={`${button} self-start`}
        onClick={() => {
          setCode("");
          setState("idle");
        }}
      >
        Reset
      </button>
    </div>
  );
}
