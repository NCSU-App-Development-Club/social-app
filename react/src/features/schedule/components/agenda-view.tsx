import { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";

import {
  addDays,
  dayKey,
  formatTime,
  isSameDay,
  MONTH_SHORT,
  startOfDay,
  WEEKDAY_SHORT,
} from "../date-utils";
import type { Occurrence } from "../types";
import { useAppTheme } from "@/theme/use-app-theme";

type AgendaViewProps = {
  from: Date;
  occurrences: Occurrence[];
  onPressOccurrence: (occurrence: Occurrence) => void;
  onEndReached: () => void;
};

// Google Calendar's "Schedule" view: a list of upcoming days that have events.
export function AgendaView({ from, occurrences, onPressOccurrence, onEndReached }: AgendaViewProps) {
  const { colors } = useAppTheme();
  const today = new Date();

  const sections = useMemo(() => {
    const byDay = new Map<string, { day: Date; data: Occurrence[] }>();
    const first = startOfDay(from);
    for (const occurrence of occurrences) {
      // Multi-day events show on each day they cover (from the start of the list).
      const last = new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1));
      let day = startOfDay(occurrence.start < first ? first : occurrence.start);
      for (; day <= last; day = addDays(day, 1)) {
        const key = dayKey(day);
        if (!byDay.has(key)) byDay.set(key, { day, data: [] });
        byDay.get(key)!.data.push(occurrence);
      }
    }
    return [...byDay.values()].sort((a, b) => a.day.getTime() - b.day.getTime());
  }, [from, occurrences]);

  const timeLabel = (occurrence: Occurrence, day: Date) => {
    if (occurrence.event.allDay) return "All day";
    const startsToday = isSameDay(occurrence.start, day);
    const endsToday = isSameDay(new Date(occurrence.end.getTime() - 1), day);
    if (startsToday && endsToday) {
      return `${formatTime(occurrence.start)} – ${formatTime(occurrence.end)}`;
    }
    if (startsToday) return `Starts ${formatTime(occurrence.start)}`;
    if (endsToday) return `Until ${formatTime(occurrence.end)}`;
    return "All day";
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.key}-${index}`}
      stickySectionHeadersEnabled={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.text }]}>
          Nothing scheduled. Tap + to add an event or import a calendar.
        </Text>
      }
      renderSectionHeader={({ section }) => {
        const isToday = isSameDay(section.day, today);
        return (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionWeekday, { color: isToday ? colors.primary : colors.text }]}>
              {WEEKDAY_SHORT[section.day.getDay()].toUpperCase()}
            </Text>
            <Text style={[styles.sectionDate, { color: isToday ? colors.primary : colors.text }]}>
              {MONTH_SHORT[section.day.getMonth()]} {section.day.getDate()}
              {section.day.getFullYear() !== today.getFullYear() && `, ${section.day.getFullYear()}`}
            </Text>
          </View>
        );
      }}
      renderItem={({ item, section }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onPressOccurrence(item)}
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: item.event.color },
            pressed && { opacity: 0.8 },
          ]}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.event.title}
          </Text>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {timeLabel(item, section.day)}
            {item.event.location ? ` · ${item.event.location}` : ""}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  empty: {
    textAlign: "center",
    marginTop: 48,
    opacity: 0.6,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionWeekday: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionDate: {
    fontSize: 16,
    fontWeight: "600",
  },
  item: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  itemMeta: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 13,
    marginTop: 2,
  },
});
