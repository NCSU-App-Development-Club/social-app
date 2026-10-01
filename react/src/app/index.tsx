import { Button, Column, Host } from "@expo/ui";
import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";

export default function Login() {
  const { colors, scheme } = useAppTheme();

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Host style={styles.host} colorScheme={scheme}>
        <Column spacing={12} alignment="center">
          <Text style={{ color: colors.text }}>Login page</Text>
          <Button
            label="Skip login"
            onPress={() => router.navigate("/profile")}
          />
        </Column>
      </Host>
    </Screen>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
