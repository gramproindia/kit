import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../../source/components/button";
import { Modal } from "../../source/components/modal";
import type { ModalPlacement, ModalSize } from "../../source/components/modal";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ModalDemo() {
  const { tokens } = useKitTheme();
  const [placement, setPlacement] = useState<ModalPlacement>("center");
  const [size, setSize] = useState<ModalSize>("md");
  const [open, setOpen] = useState(false);
  const [guarded, setGuarded] = useState(false);
  const [lastReason, setLastReason] = useState("—");

  const show = (p: ModalPlacement, s: ModalSize = "md") => {
    setPlacement(p);
    setSize(s);
    setOpen(true);
  };

  const body = (
    <View style={{ gap: 10 }}>
      <Text style={{ color: tokens.fg, fontSize: tokens.fontSize, lineHeight: tokens.fontSize * 1.45 }}>
        Close with ×, the backdrop, or Android back. The body scrolls when it is long; the footer stays put.
      </Text>
      {Array.from({ length: placement === "right" || placement === "left" ? 4 : 2 }, (_, i) => (
        <Text key={i} style={{ color: tokens.muted, fontSize: tokens.fontSize }}>
          Line {i + 1}: invoice #{1040 + i}, ₹{(12500 * (i + 1)).toLocaleString("en-IN")}
        </Text>
      ))}
    </View>
  );

  return (
    <>
      <Section title="Modal · placements">
        <Row>
          <Button variant="outline" onPress={() => show("center")}>
            Center
          </Button>
          <Button variant="outline" onPress={() => show("top", "sm")}>
            Top · sm
          </Button>
          <Button variant="outline" onPress={() => show("bottom")}>
            Bottom sheet
          </Button>
        </Row>
        <Row>
          <Button variant="outline" onPress={() => show("left")}>
            Left drawer
          </Button>
          <Button variant="outline" onPress={() => show("right")}>
            Right drawer
          </Button>
          <Button variant="outline" onPress={() => show("center", "full")}>
            Full screen
          </Button>
        </Row>
        <Text style={{ color: tokens.muted }}>Last close reason: {lastReason}</Text>
      </Section>

      <Section title="Modal · onBeforeClose">
        <Button variant="secondary" onPress={() => setGuarded(true)}>
          Edit with unsaved changes
        </Button>
      </Section>

      <Modal
        open={open}
        onOpenChange={(next, reason) => {
          setOpen(next);
          if (!next) setLastReason(reason ?? "—");
        }}
        placement={placement}
        size={size}
        title="Invoice #1042"
        description="Sent to Gram Panchayat, Kottayam"
        footer={({ close }) => (
          <>
            <Button variant="outline" onPress={close}>
              Cancel
            </Button>
            <Button onPress={() => wait(800).then(close)}>Mark paid</Button>
          </>
        )}
      >
        {body}
      </Modal>

      <Modal
        open={guarded}
        onOpenChange={setGuarded}
        title="Edit customer"
        closeOnBackdrop={false}
        onBeforeClose={(reason) => reason === "api"}
        footer={({ close }) => <Button onPress={close}>Save and close</Button>}
      >
        <Text style={{ color: tokens.fg, fontSize: tokens.fontSize, lineHeight: tokens.fontSize * 1.45 }}>
          The backdrop does nothing and × or back is refused by onBeforeClose: only "Save and close" closes it.
        </Text>
      </Modal>
    </>
  );
}
