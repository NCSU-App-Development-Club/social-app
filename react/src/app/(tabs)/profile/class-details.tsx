import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";

export default function ClassDetails() {
  // Temporary data.
  // Later this can come directly from the backend.
  const classInfo = {
    name: "CSC 316",
    section: "001",
    days: "M&W",
    time: "10:30am",
    location: "EBI 2102",
    students: ["Person 1", "Person 2", "Person 3", "Person 4", "Person 5", "Person 6", "Person 7", "Person 8"],
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* NC State Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>NC STATE</Text>

          <Text style={styles.logo}>S</Text>
        </View>

        <ScrollView>
          {/* Class name */}
          <View style={styles.classTitle}>
            <Text style={styles.classTitleText}>
              {classInfo.name} ({classInfo.section})
            </Text>
          </View>

          {/* Class information */}
          <View style={styles.infoRow}>
            <SymbolView
              name="calendar"
              tintColor="#CC0000"
              size={21}
            />

            <Text style={styles.infoText}>
              {classInfo.days} @ {classInfo.time}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <SymbolView
              name="mappin"
              tintColor="#CC0000"
              size={21}
            />

            <Text style={styles.infoText}>{classInfo.location}</Text>
          </View>

          <View style={styles.studentCount}>
            <SymbolView
              name="person.2"
              tintColor="#CC0000"
              size={21}
            />

            <Text style={styles.infoText}>{classInfo.students.length} Students in this class</Text>
          </View>

          {/* Students */}
          <View style={styles.students}>
            {classInfo.students.map((student, index) => (
              <View
                style={styles.studentRow}
                key={index}>
                <View style={styles.personIcon}>
                  <SymbolView
                    name="person.fill"
                    tintColor="#CC0000"
                    size={20}
                  />
                </View>

                <Text style={styles.studentName}>{student}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 48,
    backgroundColor: "#CC0000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  headerText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
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

  personIcon: {
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
