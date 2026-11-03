import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button } from "../../../../source/components/button";
import { Select } from "../../../../source/components/combobox";
import { Input } from "../../../../source/components/input";
import { useKitTheme } from "../../../../source/components/shared/native";
import { toast } from "../../../../source/components/toaster";
import { AppBar } from "../../../../source/native/app-bar";

const STATES = [
  { value: "KL", label: "Kerala" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "KA", label: "Karnataka" },
  { value: "MH", label: "Maharashtra" },
  { value: "DL", label: "Delhi" },
];

/** A small form inside a native-tabs screen. */
export default function Profile() {
  const { tokens } = useKitTheme();
  const [name, setName] = useState("Grampro Books");
  const [state, setState] = useState<string | null>("KL");
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <AppBar title="Profile" subtitle="Native tabs" onBack={() => router.back()} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <Input label="Business name" value={name} onValueChange={setName} />
        <Select label="State" options={STATES} value={state} onChange={(value) => setState(value)} />
        <Button onPress={() => toast.success("Profile saved")}>Save</Button>
      </ScrollView>
    </View>
  );
}
