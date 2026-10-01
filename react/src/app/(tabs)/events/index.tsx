import { Text } from "react-native";

import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";
import { useState } from "react";

// When building your layout, be sure to prioritize the components imported from @expo/ui.
// These will look native on iOS (with liquid glass) and Android (with Material 3 design).
// Explore all the available components: https://docs.expo.dev/versions/latest/sdk/ui/universal/#components
export default function Events() {
  const { colors } = useAppTheme();

  const [userData, setUserData] = useState({
    "events": [
      {
        "name": "Peter Thiel",
        "avatar": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX4GaRd2-BnlH6d7GK2TAXAcAANPAqshvKQwkfOE2VKTJDbmc_prN1R4_CR5Tu0pRjY0tpKsKjsNlrASMxntpTJvuZu_GuqHLlKnDrwzuh&s=10",
        "description": "Dinner at Fountain",
        "time": "7:30 PM",
        "date": "10/01/26",
        "attendees": [
          {
            "name": "Jensen Huang"
          }
        ]
      }
    ]
  });

  const [eventIndex, setEventIndex] = useState(0);

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Text style={{ color: colors.text }}>{userData.events[eventIndex].name}</Text>
    </Screen>
  );
}
