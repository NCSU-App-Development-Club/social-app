import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { AgendaView } from "@/features/schedule/components/agenda-view";
import { MonthView, monthGridRange } from "@/features/schedule/components/month-view";
import { TimeGridView } from "@/features/schedule/components/time-grid-view";
import {
  addDays,
  addMonths,
  formatShortDate,
  MONTH_LONG,
  MONTH_SHORT,
  startOfDay,
  startOfWeek,
} from "@/features/schedule/date-utils";
import { expandEvents } from "@/features/schedule/recurrence";
import { useSchedule } from "@/features/schedule/store";
import type { Occurrence } from "@/features/schedule/types";
import { useAppTheme } from "@/theme/use-app-theme";

type CalendarView = "day" | "3day" | "week" | "month" | "agenda";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "3day", label: "3 Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "agenda", label: "Schedule" },
];

const AGENDA_PAGE_DAYS = 60;
const AGENDA_MAX_DAYS = 730;

function visibleRange(view: CalendarView, cursor: Date, agendaDays: number) {
  const day = startOfDay(cursor);
  switch (view) {
    case "day":
      return { start: day, end: addDays(day, 1) };
    case "3day":
      return { start: day, end: addDays(day, 3) };
    case "week": {
      const start = startOfWeek(cursor);
      return { start, end: addDays(start, 7) };
    }
    case "month":
      return monthGridRange(cursor);
    case "agenda":
      return { start: day, end: addDays(day, agendaDays) };
  }
}

function step(view: CalendarView, cursor: Date, direction: 1 | -1): Date {
  switch (view) {
    case "day":
      return addDays(cursor, direction);
    case "3day":
      return addDays(cursor, 3 * direction);
    case "week":
      return addDays(cursor, 7 * direction);
    case "month":
      return addMonths(cursor, direction);
    case "agenda":
      return addDays(cursor, 30 * direction);
  }
}

function title(view: CalendarView, cursor: Date, range: { start: Date; end: Date }): string {
  if (view === "day") return `${formatShortDate(cursor)}, ${cursor.getFullYear()}`;
  if (view === "month") return `${MONTH_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const last = addDays(range.end, -1);
  if (view === "agenda" || range.start.getMonth() === last.getMonth()) {
    return `${MONTH_LONG[range.start.getMonth()]} ${range.start.getFullYear()}`;
  }
  return `${MONTH_SHORT[range.start.getMonth()]} – ${MONTH_SHORT[last.getMonth()]} ${last.getFullYear()}`;
}

// The next whole hour on `day` (or 9 AM if `day` isn't today).
function defaultStartFor(day: Date): Date {
  const now = new Date();
  const start = startOfDay(day);
  if (start.getTime() === startOfDay(now).getTime()) {
    start.setHours(Math.min(now.getHours() + 1, 23));
  } else {
    start.setHours(9);
  }
  return start;
}

export default function Schedule() {
  const { colors } = useAppTheme();
  const { events } = useSchedule();
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [agendaDays, setAgendaDays] = useState(AGENDA_PAGE_DAYS);

  const range = visibleRange(view, cursor, agendaDays);
  const occurrences = useMemo(
    () => expandEvents(events, range.start, range.end),
    // Range is derived from these; Date objects aren't stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, range.start.getTime(), range.end.getTime()],
  );

  const days = useMemo(() => {
    const count = view === "day" ? 1 : view === "3day" ? 3 : 7;
    return Array.from({ length: count }, (_, i) => addDays(range.start, i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, range.start.getTime()]);

  const openOccurrence = (occurrence: Occurrence) =>
    router.push({
      pathname: "/schedule/event/[id]",
      params: { id: occurrence.event.id, start: String(occurrence.start.getTime()) },
    });

  const createAt = (start: Date) =>
    router.push({ pathname: "/schedule/edit", params: { date: String(start.getTime()) } });

  const close = () => (router.canGoBack() ? router.back() : router.replace("/profile"));

  return (
    <Screen edges={["top", "left", "right"]}>
      <View style={styles.toolbar}>
        <IconButton label="✕" accessibilityLabel="Close schedule" onPress={close} />
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title(view, cursor, range)}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={[styles.todayButton, { borderColor: colors.border }]}
          onPress={() => {
            setCursor(startOfDay(new Date()));
            setAgendaDays(AGENDA_PAGE_DAYS);
          }}>
          <Text style={[styles.todayLabel, { color: colors.text }]}>Today</Text>
        </Pressable>
        <IconButton
          label="⤓"
          accessibilityLabel="Import calendar"
          onPress={() => router.push("/schedule/import")}
        />
      </View>

      <View style={styles.toolbar}>
        <IconButton
          label="‹"
          accessibilityLabel="Previous"
          onPress={() => setCursor((c) => step(view, c, -1))}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.viewsScroller}
          contentContainerStyle={styles.views}>
          {VIEWS.map((option) => {
            const selected = option.value === view;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setView(option.value)}
                style={[
                  styles.viewChip,
                  { borderColor: colors.border },
                  selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}>
                <Text style={[styles.viewLabel, { color: selected ? colors.onPrimary : colors.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <IconButton
          label="›"
          accessibilityLabel="Next"
          onPress={() => setCursor((c) => step(view, c, 1))}
        />
      </View>

      <View style={styles.body}>
        {view === "month" ? (
          <MonthView
            cursor={cursor}
            occurrences={occurrences}
            onPressOccurrence={openOccurrence}
            onPressDay={(day) => {
              setCursor(day);
              setView("day");
            }}
          />
        ) : view === "agenda" ? (
          <AgendaView
            from={range.start}
            occurrences={occurrences}
            onPressOccurrence={openOccurrence}
            onEndReached={() => setAgendaDays((d) => Math.min(d + AGENDA_PAGE_DAYS, AGENDA_MAX_DAYS))}
          />
        ) : (
          <TimeGridView
            days={days}
            occurrences={occurrences}
            onPressOccurrence={openOccurrence}
            onPressSlot={createAt}
            onPressDay={(day) => {
              setCursor(day);
              setView("day");
            }}
          />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New event"
        onPress={() => createAt(defaultStartFor(cursor))}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.85 },
        ]}>
        <Text style={[styles.fabLabel, { color: colors.onPrimary }]}>+</Text>
      </Pressable>
    </Screen>
  );
}

function IconButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.card }]}>
      <Text style={[styles.iconLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 4,
  },
  todayButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    fontSize: 22,
  },
  // Without flex: 1 the chip row sizes to its content and pushes the › button off narrow phones.
  viewsScroller: {
    flex: 1,
  },
  views: {
    gap: 6,
    paddingHorizontal: 4,
  },
  viewChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  viewLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  body: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabLabel: {
    fontSize: 32,
    lineHeight: 34,
  },
});
