import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useAppTheme } from "@/theme/use-app-theme";

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={colors.card}
      iconColor={{ default: colors.text, selected: colors.primary }}
      tintColor={colors.primary}
      indicatorColor={colors.surfaceTint}
      labelStyle={{
        default: { color: colors.text },
        selected: { color: colors.primary },
      }}>
      {/* TODO lazy load the tabs that require data fetching - https://docs.expo.dev/router/advanced/native-tabs/#lazy-loading */}
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="account_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="event" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="connections">
        <NativeTabs.Trigger.Label>Connections</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="share" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
