import { DateTimePicker } from "@expo/ui/community/datetime-picker";

import { withDateOf, withTimeOf } from "../date-utils";
import { useAppTheme } from "@/theme/use-app-theme";

export type DateFieldProps = {
  value: Date;
  mode: "date" | "time";
  onChange: (value: Date) => void;
};

// iOS: the native compact picker shows the value and opens a popover on tap.
export function DateField({ value, mode, onChange }: DateFieldProps) {
  const { colors, scheme } = useAppTheme();

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display="compact"
      accentColor={colors.primary}
      themeVariant={scheme}
      onValueChange={(_, picked) =>
        onChange(mode === "date" ? withDateOf(value, picked) : withTimeOf(value, picked))
      }
    />
  );
}
