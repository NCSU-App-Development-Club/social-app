import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { formatShortDate, formatTime, withDateOf, withTimeOf } from "../date-utils";
import type { DateFieldProps } from "./date-field";
import { useAppTheme } from "@/theme/use-app-theme";

// Android: a text button that opens the Material date/time dialog.
export function DateField({ value, mode, onChange }: DateFieldProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={[styles.field, { backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}>
        <Text style={[styles.label, { color: colors.text }]}>
          {mode === "date" ? `${formatShortDate(value)}, ${value.getFullYear()}` : formatTime(value)}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode={mode}
          accentColor={colors.primary}
          onValueChange={(_, picked) => {
            setOpen(false);
            onChange(mode === "date" ? withDateOf(value, picked) : withTimeOf(value, picked));
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  label: {
    fontSize: 15,
  },
});
