import { useState } from "react";
import { Text, TextInput } from "react-native";
import { Button } from "../../source/components/button";
import { useKitTheme } from "../../source/components/shared/native";
import { BottomSheet, BottomSheetClose } from "../../source/native/bottom-sheet";
import { ListItem, List } from "../../source/native/list-item";
import { Row, Section } from "./layout";

export function BottomSheetDemo() {
  const { tokens } = useKitTheme();
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("nothing yet");
  const [note, setNote] = useState("");
  return (
    <Section title="BottomSheet">
      <Row>
        <BottomSheet
          trigger={<Button variant="outline">Share</Button>}
          title="Share invoice"
          description="Pick how to send INV-2041."
          footer={(close) => (
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
          )}
        >
          {(close) => (
            <List style={{ marginHorizontal: -16 }}>
              {["Copy link", "WhatsApp", "Email", "Download PDF"].map((label) => (
                <ListItem
                  key={label}
                  title={label}
                  onPress={() => {
                    setLast(label);
                    close();
                  }}
                />
              ))}
            </List>
          )}
        </BottomSheet>
        <Button variant="outline" onPress={() => setOpen(true)}>
          Add note (controlled)
        </Button>
      </Row>
      <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>Last action: {last}</Text>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Add a note"
        footer={
          <>
            <BottomSheetClose>
              <Button variant="ghost">Discard</Button>
            </BottomSheetClose>
            <Button
              onPress={() => {
                setLast(note ? `note "${note}"` : "empty note");
                setOpen(false);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Type a note; the sheet stays above the keyboard"
          placeholderTextColor={tokens.muted}
          multiline
          style={{
            minHeight: 96,
            borderWidth: 1,
            borderColor: tokens.borderControl,
            borderRadius: tokens.radius,
            padding: 12,
            color: tokens.fg,
            fontSize: tokens.fontSize,
            textAlignVertical: "top",
          }}
        />
      </BottomSheet>
    </Section>
  );
}
