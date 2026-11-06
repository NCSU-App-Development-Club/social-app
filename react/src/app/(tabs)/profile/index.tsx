import { Image, Pressable, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";

export default function Profile() {
  const { colors } = useAppTheme();

  const name = "Brendon Hablutzel";
  const major = ["Computer Science", "Music"];
  const numberOfConnections = 102;
  const numberOfMutuals = 3;

  return (
    <Screen edges={["top", "bottom", "left", "right"]} style={{ padding: 16 }}>
      <View
        style={{
          alignSelf: "center",
          gap: 12,
          width: "100%",
          maxWidth: 480,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
          }}
        >
          <Image
            source={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX4GaRd2-BnlH6d7GK2TAXAcAANPAqshvKQwkfOE2VKTJDbmc_prN1R4_CR5Tu0pRjY0tpKsKjsNlrASMxntpTJvuZu_GuqHLlKnDrwzuh&s=10",
            }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
          <Text
            numberOfLines={1}
            style={{
              color: colors.text,
              flex: 1,
              flexShrink: 1,
              fontSize: 32,
              fontWeight: "700",
            }}
          >
            {name}
          </Text>
        </View>

        <View
          style={{
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: colors.text, flexShrink: 1, fontSize: 22 }}>
            {major.join(", ")}
          </Text>
        </View>

        <View
          style={{
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: colors.text, flexShrink: 1, fontSize: 22 }}>
            {numberOfConnections} connections, {numberOfMutuals} mutuals
          </Text>
        </View>

        <View style={{ alignSelf: "center", flexDirection: "row", gap: 12, width: "100%" }}>
          <Pressable
            accessibilityRole="button"
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: colors.primary,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "700" }}>
              Connect
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
              Message
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            About Me
          </Text>
          <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24, textAlign: "left" }}>
            Hi, I’m a student at NC State! Here’s a bit about me: Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
            magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          </Text>
        </View>

        <View
          style={{
            minHeight: 180,
            justifyContent: "center",
            padding: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: colors.border, fontSize: 16, lineHeight: 24, textAlign: "left" }}>
            Connect with this person to see their schedule...
          </Text>
        </View>
      </View>
    </Screen>
  );
}
