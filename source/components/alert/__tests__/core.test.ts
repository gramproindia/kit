import { describe, expect, it } from "vitest";
import { announcementText, liveness } from "../core/live";

describe("liveness", () => {
  it("interrupts for problems", () => {
    // Someone whose card was declined needs to hear it now, not after the
    // paragraph being read finishes.
    expect(liveness("danger")).toEqual({ role: "alert", live: "assertive" });
    expect(liveness("warning")).toEqual({ role: "alert", live: "assertive" });
  });

  it("waits its turn for everything else", () => {
    for (const variant of ["info", "success", "neutral"] as const) {
      expect(liveness(variant)).toEqual({ role: "status", live: "polite" });
    }
  });
});

describe("announcementText", () => {
  it("joins the plain-text parts of an alert into one sentence", () => {
    expect(announcementText(["Payment failed", "Your card was declined."])).toBe(
      "Payment failed. Your card was declined.",
    );
  });

  it("skips parts that cannot be spoken as text", () => {
    expect(announcementText([undefined, { type: "b" }, "  ", 3])).toBe("3");
    expect(announcementText([])).toBe("");
  });
});
