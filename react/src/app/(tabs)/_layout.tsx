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
      {/* Profile */}
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          md="account_circle"
        />
      </NativeTabs.Trigger>

      {/* Events */}
      <NativeTabs.Trigger name="events">
        <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          md="event"
        />
      </NativeTabs.Trigger>

      {/* Connections */}
      <NativeTabs.Trigger name="connections">
        <NativeTabs.Trigger.Label>Connections</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          md="share"
        />
      </NativeTabs.Trigger>

      {/* Temporary class details page */}
      <NativeTabs.Trigger name="temp">
        <NativeTabs.Trigger.Label>Temp</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.2.fill"
          md="groups"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
