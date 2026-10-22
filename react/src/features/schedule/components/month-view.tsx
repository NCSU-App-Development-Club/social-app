import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { addDays, dayKey, isSameDay, startOfDay, startOfMonth, startOfWeek, WEEKDAY_SHORT } from "../date-utils";
import type { Occurrence } from "../types";
import { useAppTheme } from "@/theme/use-app-theme";

const CHIP_HEIGHT = 17;
const DAY_NUMBER_HEIGHT = 26;

export function monthGridRange(cursor: Date): { start: Date; end: Date } {
  const start = startOfWeek(startOfMonth(cursor));
  return { start, end: addDays(start, 42) };
}

type MonthViewProps = {
  cursor: Date;
  occurrences: Occurrence[];
  onPressDay: (day: Date) => void;
  onPressOccurrence: (occurrence: Occurrence) => void;
};

export function MonthView({ cursor, occurrences, onPressDay, onPressOccurrence }: MonthViewProps) {
  const { colors } = useAppTheme();
  const [cellHeight, setCellHeight] = useState(0);
  const { start } = monthGridRange(cursor);
  const today = new Date();

  // Bucket occurrences by every day they touch.
  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const occurrence of occurrences) {
      // End is exclusive, so a 9-10am event or an all-day event ending at midnight stays on one day.
      const last = new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1));
      for (let day = startOfDay(occurrence.start); day <= last; day = addDays(day, 1)) {
        const key = dayKey(day);
        map.set(key, [...(map.get(key) ?? []), occurrence]);
      }
    }
    return map;
  }, [occurrences]);

  const maxChips = Math.max(1, Math.floor((cellHeight - DAY_NUMBER_HEIGHT) / CHIP_HEIGHT));

  return (
    <View style={styles.container}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_SHORT.map((label) => (
          <Text key={label} style={[styles.weekday, { color: colors.text }]}>
            {label.toUpperCase()}
          </Text>
        ))}
      </View>
      {Array.from({ length: 6 }, (_, week) => (
        <View
          key={week}
          style={[styles.week, { borderColor: colors.border }]}
          onLayout={week === 0 ? (e) => setCellHeight(e.nativeEvent.layout.height) : undefined}>
          {Array.from({ length: 7 }, (_, weekday) => {
            const day = addDays(start, week * 7 + weekday);
            const dayOccurrences = byDay.get(dayKey(day)) ?? [];
            const overflow = dayOccurrences.length > maxChips;
            const visible = dayOccurrences.slice(0, overflow ? maxChips - 1 : maxChips);
            const isToday = isSameDay(day, today);
            const inMonth = day.getMonth() === cursor.getMonth();

            return (
              <Pressable
                key={weekday}
                accessibilityRole="button"
                accessibilityLabel={day.toDateString()}
                style={[styles.cell, { borderColor: colors.border }]}
                onPress={() => onPressDay(day)}>
                <View
                  style={[styles.dayNumber, isToday && { backgroundColor: colors.primary }]}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      { color: isToday ? colors.onPrimary : colors.text },
                      !inMonth && styles.outside,
                    ]}>
                    {day.getDate()}
                  </Text>
                </View>
                {visible.map((occurrence) => (
                  <Pressable
                    key={occurrence.key}
                    onPress={() => onPressOccurrence(occurrence)}
                    style={[
                      styles.chip,
                      occurrence.event.allDay || !isSameDay(occurrence.start, occurrence.end)
                        ? { backgroundColor: occurrence.event.color }
                        : null,
                    ]}>
                    {!occurrence.event.allDay && isSameDay(occurrence.start, occurrence.end) && (
                      <View style={[styles.dot, { backgroundColor: occurrence.event.color }]} />
                    )}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chipText,
                        {
                          color:
                            occurrence.event.allDay || !isSameDay(occurrence.start, occurrence.end)
                              ? "#fff"
                              : colors.text,
                        },
                      ]}>
                      {occurrence.event.title}
                    </Text>
                  </Pressable>
                ))}
                {overflow && (
                  <Text style={[styles.more, { color: colors.text }]}>
                    +{dayOccurrences.length - visible.length} more
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.7,
  },
  week: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  dayNumber: {
    alignSelf: "center",
    width: 22,
    height: 22,
    borderRadius: 11,
    marginVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: "500",
  },
  outside: {
    opacity: 0.4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: CHIP_HEIGHT - 2,
    marginBottom: 2,
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 2,
  },
  chipText: {
    fontSize: 10,
    flexShrink: 1,
  },
  more: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 2,
  },
});
