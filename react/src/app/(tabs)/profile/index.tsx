import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Pressable
        style={styles.classButton}
        onPress={() => router.push("./class-details")}>
        <Text style={styles.classText}>CSC 316 (001)</Text>
        <Text style={styles.classInfo}>M&W @ 10:30am</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  classButton: {
    borderWidth: 1,
    borderColor: "#CC0000",
    padding: 15,
  },

  classText: {
    color: "#CC0000",
    fontSize: 20,
  },

  classInfo: {
    color: "#777777",
    fontSize: 16,
    marginTop: 4,
  },
});
