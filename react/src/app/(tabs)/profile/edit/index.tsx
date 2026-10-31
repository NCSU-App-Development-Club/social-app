import { Screen } from "@/components/screen";
import { useAppTheme } from "@/theme/use-app-theme";
import { Button, Host } from "@expo/ui";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";

export default function ProfileEdit() {
  const { colors, scheme } = useAppTheme();

  const [profilePicture, setProfilePicture] = useState(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX4GaRd2-BnlH6d7GK2TAXAcAANPAqshvKQwkfOE2VKTJDbmc_prN1R4_CR5Tu0pRjY0tpKsKjsNlrASMxntpTJvuZu_GuqHLlKnDrwzuh&s=10",
  );
  const [majors, setMajors] = useState("Computer Science, Music");
  const [description, setDescription] = useState("");
  const [dirty, setDirty] = useState(false);

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  } as const;

  function resetForm() {
    setProfilePicture(
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX4GaRd2-BnlH6d7GK2TAXAcAANPAqshvKQwkfOE2VKTJDbmc_prN1R4_CR5Tu0pRjY0tpKsKjsNlrASMxntpTJvuZu_GuqHLlKnDrwzuh&s=10",
    );
    setMajors("Computer Science, Music");
    setDescription("");
    setDirty(false);
  }

  async function chooseProfilePicture() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access required",
        "Allow photo access to choose a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
      setDirty(true);
    }
  }

  return (
    <Screen edges={["bottom", "left", "right"]} style={{ padding: 16 }}>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
          Edit your profile details
        </Text>
        <View>
          <Text style={{ color: colors.text, fontSize: 18, marginBottom: 6 }}>
            Profile picture
          </Text>
          <View
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Image
              source={{ uri: profilePicture }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.card,
              }}
            />
            <Host matchContents colorScheme={scheme}>
              <Button label="Choose photo" onPress={chooseProfilePicture} />
            </Host>
          </View>
        </View>
        <View>
          <Text style={{ color: colors.text, fontSize: 18, marginBottom: 6 }}>
            Major(s)
          </Text>
          <TextInput
            value={majors}
            onChangeText={(value) => {
              setMajors(value);
              setDirty(true);
            }}
            placeholder="e.g. Computer Science, Music"
            placeholderTextColor={colors.border}
            style={inputStyle}
          />
        </View>
        <View>
          <Text style={{ color: colors.text, fontSize: 18, marginBottom: 6 }}>
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              setDirty(true);
            }}
            placeholder="Tell people about yourself"
            placeholderTextColor={colors.border}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[inputStyle, { minHeight: 112 }]}
          />
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-around",
            gap: 8,
          }}
        >
          <Host matchContents colorScheme={scheme}>
            <Button
              label="Save"
              disabled={!dirty}
              onPress={() => setDirty(false)}
            />
          </Host>
          <Host matchContents colorScheme={scheme}>
            <Button label="Cancel" onPress={() => resetForm()} />
          </Host>
        </View>
      </View>
    </Screen>
  );
}
