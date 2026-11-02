import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../source/components/button";
import { Dialog, DialogHost, dialog } from "../../source/components/dialog";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function DialogDemo() {
  const { tokens } = useKitTheme();
  const [answer, setAnswer] = useState("—");
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Normally mounted once at the app root; here so the demo stands alone. */}
      <DialogHost />

      <Section title="dialog · promise API">
        <Row>
          <Button
            variant="danger"
            onPress={async () => {
              const ok = await dialog.confirm({
                title: "Delete 3 invoices?",
                description: "They move to the bin for 30 days.",
                intent: "danger",
                confirmLabel: "Delete",
                onConfirm: async () => {
                  await wait(900);
                },
              });
              setAnswer(`confirm → ${ok}`);
            }}
          >
            Confirm (danger)
          </Button>
          <Button
            variant="outline"
            onPress={async () => {
              const name = await dialog.prompt({
                title: "Rename report",
                inputLabel: "Report name",
                defaultValue: "Q3 collections",
                required: true,
                validate: (v) => (v.length > 40 ? "Keep it under 40 characters." : null),
              });
              setAnswer(`prompt → ${JSON.stringify(name)}`);
            }}
          >
            Prompt
          </Button>
        </Row>
        <Row>
          <Button
            variant="secondary"
            onPress={async () => {
              await dialog.alert({ title: "Export ready", description: "invoices-q3.xlsx was saved.", intent: "success" });
              setAnswer("alert → closed");
            }}
          >
            Alert (success)
          </Button>
          <Button
            variant="secondary"
            onPress={async () => {
              const ok = await dialog.confirm({
                title: "Retry the upload?",
                intent: "warning",
                onConfirm: async () => {
                  await wait(700);
                  throw new Error("The server is still unreachable.");
                },
              });
              setAnswer(`confirm → ${ok}`);
            }}
          >
            Confirm that fails
          </Button>
        </Row>
        <Text style={{ color: tokens.muted }}>Last answer: {answer}</Text>
      </Section>

      <Section title="Dialog · controlled">
        <Button variant="outline" onPress={() => setOpen(true)}>
          Open info dialog
        </Button>
        <Dialog
          open={open}
          kind="alert"
          intent="info"
          title="Statements are generated nightly"
          description="Changes you make today appear in tomorrow's statement."
          onClose={() => setOpen(false)}
        />
      </Section>
    </>
  );
}
