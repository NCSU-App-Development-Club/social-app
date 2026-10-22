import { Stack } from "expo-router";

import { useAppTheme } from "@/theme/use-app-theme";

export default function ScheduleLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="event/[id]" options={{ title: "" }} />
      <Stack.Screen name="edit" options={{ title: "Event" }} />
      <Stack.Screen name="import" options={{ title: "Import calendar", presentation: "modal" }} />
    </Stack>
  );
}
