import { Text, StyleSheet } from "react-native";
import { Button, Column, Host } from "@expo/ui";
import { router } from "expo-router";

import { Screen } from "@/components/screen";

export default function Login() {
  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Host style={styles.host}>
        <Column spacing={12} alignment="center">
          <Text>Login page</Text>
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
