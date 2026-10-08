import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";
import { useState } from "react";
import { Host, Icon } from "@expo/ui";

// When building your layout, be sure to prioritize the components imported from @expo/ui.
// These will look native on iOS (with liquid glass) and Android (with Material 3 design).
// Explore all the available components: https://docs.expo.dev/versions/latest/sdk/ui/universal/#components
export default function Events() {
  const { colors } = useAppTheme();

  const [userData, setUserData] = useState({
    events: [
      {
        name: "Peter Thiel",
        avatar:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX4GaRd2-BnlH6d7GK2TAXAcAANPAqshvKQwkfOE2VKTJDbmc_prN1R4_CR5Tu0pRjY0tpKsKjsNlrASMxntpTJvuZu_GuqHLlKnDrwzuh&s=10",
        description: "Dinner at Fountain?",
        location: "Fountain Dining Hall",
        time: "7:30 PM",
        date: "10/01/26",
        attendees: [
          {
            name: "Jensen Huang",
            avatar:
              "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTuJ76O3k5yteY2WJPuc1L37Q7Pb-D1vCdfMKMjJsFQelTI_wCfjhHr6X4JGGwpAI89jjm1nEaXQZWSiNrdfYaPaq7MXZavDOGSrzOx73ut1hVJLBqvCJkyaSJ1u6rtNinavH87TtC_UJg&s=19",
          },
          {
            name: "Elon Musk",
            avatar:
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRftHM47FuSUx03T_HDiKqENHJzHgT8SPyGd_Zb17Hc-erlWxBdDJZQiBTAcb6_zfgPzyK_FocWyk3ndLysMHI271jjDyF9YcNJhoTbymAIg&s=10",
          },
          {
            name: "Mark Zuckerberg",
            avatar:
              "https://techcrunch.com/wp-content/uploads/2022/08/Screen-Shot-2022-08-19-at-2.13.43-PM.png",
          },
          {
            name: "Larry Ellison",
            avatar:
              "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iK3KsHd5BPoU/v1/-1x-1.webp",
          },
          {
            name: "Michael Dell",
            avatar:
              "https://www.dell.org/wp-content/uploads/2024/10/michael-dell.jpg",
          },
          {
            name: "John Ternus",
            avatar:
              "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/John_Ternus_at_the_Apple_50th_Anniversary_Kickoff_%28cropped%29.jpg/250px-John_Ternus_at_the_Apple_50th_Anniversary_Kickoff_%28cropped%29.jpg",
          },
        ],
      },
    ],
  });

  const [eventIndex, setEventIndex] = useState(0);

  async function onPress(type: string) {
    console.log(type);
  }

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <View style={{ margin: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Image
            style={{ width: 80, height: 80, borderRadius: 100 }}
            source={{ uri: userData.events[eventIndex].avatar }}
          />
          <Text
            style={{
              color: colors.text,
              fontSize: 40,
              fontWeight: "bold",
              marginLeft: 20,
            }}
          >
            {userData.events[eventIndex].name}
          </Text>
        </View>
        <Text style={{ fontSize: 30 }}>
          {userData.events[eventIndex].description}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Host matchContents>
            <Icon
              name={Icon.select({
                ios: "clock",
                android: import("@expo/material-symbols/schedule.xml"),
              })}
              size={20}
              color="black"
            />
          </Host>

          <Text style={{ fontSize: 20, color: "#444", marginLeft: 5 }}>
            for {userData.events[eventIndex].date} at{" "}
            {userData.events[eventIndex].time}
          </Text>
        </View>

        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}
        >
          <Host matchContents>
            <Icon
              name={Icon.select({
                ios: "mappin.and.ellipse",
                android: import("@expo/material-symbols/location_on.xml"),
              })}
              size={15}
              color="black"
            />
          </Host>

          <Text style={{ fontSize: 16, color: "#444", marginLeft: 5 }}>
            {userData.events[eventIndex].location}
          </Text>
        </View>

        <Text style={{ marginTop: 20, marginBottom: 10 }}>
          {userData.events[eventIndex].attendees.length} other
          {userData.events[eventIndex].attendees.length != 1 ? "s are" : " is"}{" "}
          down
        </Text>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ width: "100%", height: "100%" }}
        >
          {userData.events[eventIndex].attendees.map((member, index) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 10,
              }}
              key={index}
            >
              <Image
                style={{ width: 50, height: 50, borderRadius: 100 }}
                source={{ uri: member.avatar }}
              />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "600",
                  marginLeft: 10,
                }}
              >
                {member.name}
              </Text>
            </View>
          ))}

          <View style={{ minHeight: 360 }} />
        </ScrollView>
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 100,
          width: "100%",
          padding: 20,
          flexDirection: "row",
        }}
      >
        <Pressable
          style={{
            width: 100,
            height: 100,
            backgroundColor: "#f00",
            borderRadius: 100,
            justifyContent: "center",
          }}
          onPress={() => onPress("decline")}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontSize: 50 }}>
            X
          </Text>
        </Pressable>

        <Pressable
          style={{
            marginLeft: "auto",
            width: 100,
            height: 100,
            backgroundColor: "#55f",
            borderRadius: 100,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => onPress("accept")}
        >
          <Host matchContents>
            <Icon
              name={Icon.select({
                ios: "checkmark",
                android: import("@expo/material-symbols/check.xml"),
              })}
              size={50}
              color="white"
            />
          </Host>
        </Pressable>
      </View>
    </Screen>
  );
}
