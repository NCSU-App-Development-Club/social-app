import { Button, Column, Host } from "@expo/ui";
import { router } from "expo-router";
import { Text } from "react-native";

import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";

// When building your layout, be sure to prioritize the components imported from @expo/ui.
// These will look native on iOS (with liquid glass) and Android (with Material 3 design).
// Explore all the available components: https://docs.expo.dev/versions/latest/sdk/ui/universal/#components
export default function Profile() {
  const { colors, scheme } = useAppTheme();

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Text style={{ color: colors.text }}>Profile page</Text>
      <Host matchContents colorScheme={scheme}>
        <Column spacing={12}>
          <Button label="Open schedule" onPress={() => router.push("/schedule")} />
        </Column>
      </Host>
    </Screen>
  );
}
