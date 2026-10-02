import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Host, Icon } from "@expo/ui";

// Icons for iOS and Android
const calendarIcon = Icon.select({
  ios: "calendar",
  android: import("@expo/material-symbols/calendar_month.xml"),
});

const locationIcon = Icon.select({
  ios: "mappin",
  android: import("@expo/material-symbols/location_on.xml"),
});

const studentsIcon = Icon.select({
  ios: "person.2.fill",
  android: import("@expo/material-symbols/group.xml"),
});

const personIcon = Icon.select({
  ios: "person.fill",
  android: import("@expo/material-symbols/person.xml"),
});

export default function ClassDetails() {
  // Temporary data.
  // Later this can come from the backend.
  const classInfo = {
    name: "CSC 316",
    section: "001",
    days: "M&W",
    time: "10:30am",
    location: "EBI 2102",
    buildingName: "Engineering Building I, NC State University, Raleigh NC",
    students: ["Person 1", "Person 2", "Person 3", "Person 4", "Person 5", "Person 6", "Person 7", "Person 8"],
  };

  // Opens the building in Google Maps
  const openLocation = () => {
    const location = encodeURIComponent(classInfo.buildingName);

    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* NC State Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>NC STATE</Text>
          <Text style={styles.universityText}>UNIVERSITY</Text>
        </View>

        <Image
          source={require("../../../../assets/images/ncstate-wolf.png")}
          style={styles.logo}
        />
      </View>

      <ScrollView>
        {/* Class name */}
        <View style={styles.classTitle}>
          <Text style={styles.classTitleText}>
            {classInfo.name} ({classInfo.section})
          </Text>
        </View>

        {/* Date and time */}
        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <Host matchContents>
              <Icon
                name={calendarIcon}
                size={21}
                color="#CC0000"
              />
            </Host>
          </View>

          <Text style={styles.infoText}>
            {classInfo.days} @ {classInfo.time}
          </Text>
        </View>

        {/* Location */}
        <Pressable
          style={styles.infoRow}
          onPress={openLocation}>
          <View style={styles.iconBox}>
            <Host matchContents>
              <Icon
                name={locationIcon}
                size={21}
                color="#CC0000"
              />
            </Host>
          </View>

          <Text style={styles.infoText}>{classInfo.location}</Text>
        </Pressable>

        {/* Students in class */}
        <View style={styles.studentCount}>
          <View style={styles.iconBox}>
            <Host matchContents>
              <Icon
                name={studentsIcon}
                size={21}
                color="#CC0000"
              />
            </Host>
          </View>

          <Text style={styles.infoText}>{classInfo.students.length} Students in this class</Text>
        </View>

        {/* Student list */}
        <View style={styles.students}>
          {classInfo.students.map((student, index) => (
            <View
              style={styles.studentRow}
              key={index}>
              <View style={styles.studentIcon}>
                <Host matchContents>
                  <Icon
                    name={personIcon}
                    size={20}
                    color="#CC0000"
                  />
                </Host>
              </View>

              <Text style={styles.studentName}>{student}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 45,
  },

  header: {
    height: 48,
    backgroundColor: "#CC0000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },

  universityText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "300",
    letterSpacing: 1,
    marginLeft: -2,
    transform: [{ scaleX: 0.82 }],
  },

  logo: {
    width: 65,
    height: 65,
    resizeMode: "contain",
    marginRight: -8,
  },

  classTitle: {
    height: 41,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#888888",
    paddingHorizontal: 13,
  },

  classTitleText: {
    color: "#CC0000",
    fontSize: 27,
    fontWeight: "400",
  },

  infoRow: {
    height: 35,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },

  studentCount: {
    height: 39,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#888888",
  },

  iconBox: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  infoText: {
    color: "#8A8A8A",
    fontSize: 18,
    fontWeight: "400",
  },

  students: {
    paddingHorizontal: 10,
  },

  studentRow: {
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    gap: 16,
  },

  studentIcon: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: "#CC0000",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  studentName: {
    color: "#B6B6B6",
    fontSize: 18,
    fontWeight: "400",
  },
});
