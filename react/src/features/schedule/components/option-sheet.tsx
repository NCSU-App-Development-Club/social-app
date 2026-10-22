import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/use-app-theme";

export type SheetOption<T> = {
  label: string;
  value: T;
  destructive?: boolean;
};

type OptionSheetProps<T> = {
  visible: boolean;
  title?: string;
  message?: string;
  options: SheetOption<T>[];
  selected?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

// A cross-platform action sheet. Alert.alert is a no-op on web, so prompts
// like "Edit this event / all events" go through this instead.
export function OptionSheet<T>({
  visible,
  title,
  message,
  options,
  selected,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
          {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
          {message && <Text style={[styles.message, { color: colors.text }]}>{message}</Text>}
          {options.map((option, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              style={({ pressed }) => [styles.option, pressed && { opacity: 0.5 }]}
              onPress={() => onSelect(option.value)}>
              <View
                style={[
                  styles.radio,
                  { borderColor: colors.border },
                  selected !== undefined && option.value === selected && {
                    borderColor: colors.primary,
                    borderWidth: 6,
                  },
                  selected === undefined && styles.hidden,
                ]}
              />
              <Text
                style={[
                  styles.optionLabel,
                  { color: option.destructive ? colors.notification : colors.text },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" style={styles.cancel} onPress={onClose}>
            <Text style={[styles.cancelLabel, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 20,
    paddingVertical: 16,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    opacity: 0.7,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  hidden: {
    display: "none",
  },
  optionLabel: {
    fontSize: 16,
    flexShrink: 1,
  },
  cancel: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
