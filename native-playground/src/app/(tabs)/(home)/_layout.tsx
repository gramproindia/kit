import { Stack } from "expo-router";
import { useKitTheme } from "../../../../../source/components/shared/native";

/** This tab's own stack: its first screen, then the screens pushed from it. */
export default function TabStack() {
  const { tokens } = useKitTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.bg } }} />;
}
