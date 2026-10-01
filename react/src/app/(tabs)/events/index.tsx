import { Text } from "react-native";

import { Screen } from "@/components/screen";

// When building your layout, be sure to prioritize the components imported from @expo/ui.
// These will look native on iOS (with liquid glass) and Android (with Material 3 design).
// Explore all the available components: https://docs.expo.dev/versions/latest/sdk/ui/universal/#components
export default function Events() {
  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Text>Events page</Text>
    </Screen>
  );
}
