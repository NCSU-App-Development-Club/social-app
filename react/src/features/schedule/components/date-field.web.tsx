import { dayKey } from "../date-utils";
import type { DateFieldProps } from "./date-field";
import { useAppTheme } from "@/theme/use-app-theme";

// Web: the DateTimePicker renders nothing, so fall back to native browser inputs.
export function DateField({ value, mode, onChange }: DateFieldProps) {
  const { colors, scheme } = useAppTheme();
  const time = `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

  return (
    <input
      type={mode}
      value={mode === "date" ? dayKey(value) : time}
      onChange={(e) => {
        const raw = e.currentTarget.value;
        if (!raw) return;
        const next = new Date(value);
        if (mode === "date") {
          const [y, m, d] = raw.split("-").map(Number);
          next.setFullYear(y, m - 1, d);
        } else {
          const [h, min] = raw.split(":").map(Number);
          next.setHours(h, min, 0, 0);
        }
        onChange(next);
      }}
      style={{
        colorScheme: scheme,
        color: colors.text,
        backgroundColor: colors.card,
        border: "none",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 15,
        fontFamily: "inherit",
      }}
    />
  );
}
