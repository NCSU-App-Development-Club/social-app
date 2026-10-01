import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs>
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
