import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../source/components/button";
import { useKitTheme } from "../../source/components/shared/native";
import { toast, Toaster, type ToastPosition } from "../../source/components/toaster";
import { Row, Section } from "./layout";

const wait = (ms: number, fail = false) =>
  new Promise<string>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("Timed out")) : resolve("42 rows")), ms));

export function ToasterDemo() {
  const { tokens } = useKitTheme();
  const [position, setPosition] = useState<ToastPosition>("top-center");

  return (
    <>
      {/* Normally mounted once at the app root; here so the demo stands alone. */}
      <Toaster position={position} />

      <Section title="toast · types">
        <Row>
          <Button variant="outline" onPress={() => toast("Draft saved")}>
            Default
          </Button>
          <Button variant="outline" onPress={() => toast.success("Payment received", { description: "₹12,500 from Ward 4" })}>
            Success
          </Button>
          <Button variant="outline" onPress={() => toast.error("Upload failed", { description: "Check your connection." })}>
            Error
          </Button>
        </Row>
        <Row>
          <Button variant="outline" onPress={() => toast.warning("Storage almost full")}>
            Warning
          </Button>
          <Button variant="outline" onPress={() => toast.info("New version available")}>
            Info
          </Button>
          <Button
            variant="outline"
            onPress={() => {
              const id = toast.loading("Syncing…");
              setTimeout(() => toast.update(id, { type: "success", title: "Synced", duration: 3000 }), 1500);
            }}
          >
            Loading → done
          </Button>
        </Row>
      </Section>

      <Section title="toast · actions and promise">
        <Row>
          <Button
            variant="secondary"
            onPress={() =>
              toast("Invoice deleted", {
                action: { label: "Undo", onClick: () => toast.success("Restored") },
                cancel: { label: "Dismiss", onClick: () => undefined },
                duration: 8000,
              })
            }
          >
            With undo
          </Button>
          <Button
            variant="secondary"
            onPress={() =>
              void toast
                .promise(wait(1500), {
                  loading: "Importing…",
                  success: (rows) => `Imported ${rows}`,
                  error: (e) => `Import failed: ${(e as Error).message}`,
                })
                .catch(() => undefined)
            }
          >
            Promise
          </Button>
          <Button
            variant="secondary"
            onPress={() =>
              void toast
                .promise(wait(1200, true), { loading: "Exporting…", error: "Export failed" })
                .catch(() => undefined)
            }
          >
            Promise fails
          </Button>
        </Row>
        <Button variant="ghost" onPress={() => toast.dismiss()}>
          Dismiss all
        </Button>
      </Section>

      <Section title="Toaster · position">
        <Row>
          {(["top-center", "bottom-center", "top-right", "bottom-left"] as const).map((p) => (
            <Button key={p} size="sm" variant={p === position ? "primary" : "outline"} onPress={() => setPosition(p)}>
              {p}
            </Button>
          ))}
        </Row>
        <Text style={{ color: tokens.muted }}>Swipe a toast sideways to dismiss it; hold it to pause its timer.</Text>
      </Section>
    </>
  );
}
