import { Image, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";

export default function Profile() {
  const { colors } = useAppTheme();

  const name = "Peter Thiel";
  const major = ["Computer Science", "Music"];
  const numberOfConnections = 102;
  const numberOfMutuals = 3;

  return (
    <Screen edges={["bottom", "left", "right"]} style={{ padding: 16 }}>
      <View style={{ gap: 12 }}>
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
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: "700" }}>
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
          <Text style={{ color: colors.text, fontSize: 22 }}>
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
          <Text style={{ color: colors.text, fontSize: 22 }}>
            {numberOfConnections} connections, {numberOfMutuals} mutuals
          </Text>
        </View>
      </View>
    </Screen>
  );
}
