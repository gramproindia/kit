import { useState, type ComponentType } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";
import { AlertDemo } from "./AlertDemo";
import { AvatarDemo } from "./AvatarDemo";
import { BadgeDemo } from "./BadgeDemo";
import { ButtonDemo } from "./ButtonDemo";
import { CardDemo } from "./CardDemo";
import { CheckboxDemo } from "./CheckboxDemo";
import { InputDemo } from "./InputDemo";
import { RadioGroupDemo } from "./RadioGroupDemo";
import { TextareaDemo } from "./TextareaDemo";
import { OverlayDemo } from "./OverlayDemo";
import { DatePickerDemo } from "./DatePickerDemo";
import { ComboboxDemo } from "./ComboboxDemo";
import { DialogDemo } from "./DialogDemo";
import { ModalDemo } from "./ModalDemo";
import { ToasterDemo } from "./ToasterDemo";
import { BreadcrumbDemo } from "./BreadcrumbDemo";
import { MenuDemo } from "./MenuDemo";
import { PopoverDemo } from "./PopoverDemo";
import { TooltipDemo } from "./TooltipDemo";
import { AccordionDemo } from "./AccordionDemo";
import { FileUploaderDemo } from "./FileUploaderDemo";
import { NumberInputDemo } from "./NumberInputDemo";
import { TabsDemo } from "./TabsDemo";
import { ProgressDemo } from "./ProgressDemo";
import { SkeletonDemo } from "./SkeletonDemo";
import { SpinnerDemo } from "./SpinnerDemo";
import { SwitchDemo } from "./SwitchDemo";

const GROUPS: Record<string, ComponentType[]> = {
  Pickers: [ComboboxDemo, DatePickerDemo],
  Overlays: [ToasterDemo, DialogDemo, ModalDemo, MenuDemo, PopoverDemo, TooltipDemo, OverlayDemo],
  Forms: [InputDemo, NumberInputDemo, TextareaDemo, CheckboxDemo, RadioGroupDemo, SwitchDemo, FileUploaderDemo],
  Actions: [ButtonDemo, BadgeDemo],
  Display: [TabsDemo, AccordionDemo, CardDemo, AvatarDemo, AlertDemo, BreadcrumbDemo],
  Feedback: [ProgressDemo, SpinnerDemo, SkeletonDemo],
};

export function Gallery() {
  const { tokens } = useKitTheme();
  const names = Object.keys(GROUPS);
  const [group, setGroup] = useState(names[0]);
  const demos = GROUPS[group] ?? [];
  return (
    <View style={styles.root}>
      <View style={[styles.tabs, { borderColor: tokens.border }]} role="tablist">
        {names.map((name) => {
          const active = name === group;
          return (
            <Pressable
              key={name}
              role="tab"
              aria-selected={active}
              onPress={() => setGroup(name)}
              style={[styles.tab, active && { borderColor: tokens.accent }]}
            >
              <Text style={{ color: active ? tokens.accent : tokens.muted, fontWeight: "600" }}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView
        key={group}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {demos.map((Demo, index) => (
          <Demo key={index} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: "row", gap: 4, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingHorizontal: 10, paddingVertical: 12, borderBottomWidth: 2, borderColor: "transparent" },
  content: { padding: 16, paddingBottom: 96, gap: 28 },
});
