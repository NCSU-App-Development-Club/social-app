import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  addDays,
  addMinutes,
  formatHourLabel,
  formatTime,
  isSameDay,
  MS_PER_DAY,
  MS_PER_MINUTE,
  startOfDay,
  WEEKDAY_SHORT,
} from "../date-utils";
import type { Occurrence } from "../types";
import { useAppTheme } from "@/theme/use-app-theme";

const HOUR_HEIGHT = 52;
const GUTTER_WIDTH = 52;
const MIN_EVENT_HEIGHT = 20;
const MAX_ALL_DAY_ROWS = 3;

type Segment = {
  occurrence: Occurrence;
  top: number;
  height: number;
  column: number;
  columns: number;
};

// Events shown in the all-day strip rather than on the hour grid.
function isAllDayLike(occurrence: Occurrence): boolean {
  return (
    occurrence.event.allDay || occurrence.end.getTime() - occurrence.start.getTime() >= MS_PER_DAY
  );
}

// Lays out a day's timed events side by side where they overlap, like Google Calendar.
function layoutDay(day: Date, occurrences: Occurrence[]): Segment[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = addDays(day, 1).getTime();
  const items = occurrences
    .filter((o) => !isAllDayLike(o) && o.start.getTime() < dayEnd && o.end.getTime() > dayStart)
    .map((occurrence) => {
      const start = Math.max(occurrence.start.getTime(), dayStart);
      const end = Math.max(Math.min(occurrence.end.getTime(), dayEnd), start);
      const top = ((start - dayStart) / MS_PER_MINUTE / 60) * HOUR_HEIGHT;
      const height = Math.max(((end - start) / MS_PER_MINUTE / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT);
      return { occurrence, top, height, column: 0, columns: 1 };
    })
    .sort((a, b) => a.top - b.top || b.height - a.height);

  let cluster: Segment[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;
  const finishCluster = () => {
    for (const segment of cluster) segment.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.top >= clusterEnd) finishCluster();
    let column = columnEnds.findIndex((end) => end <= item.top);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = item.top + item.height;
    item.column = column;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.top + item.height);
  }
  finishCluster();
  return items;
}

type TimeGridViewProps = {
  days: Date[];
  occurrences: Occurrence[];
  onPressDay: (day: Date) => void;
  onPressOccurrence: (occurrence: Occurrence) => void;
  onPressSlot: (start: Date) => void;
};

export function TimeGridView({
  days,
  occurrences,
  onPressDay,
  onPressOccurrence,
  onPressSlot,
}: TimeGridViewProps) {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), MS_PER_MINUTE);
    return () => clearInterval(timer);
  }, []);

  // Start scrolled to the working day (or just above the current time).
  const showsToday = days.some((day) => isSameDay(day, now));
  useEffect(() => {
    const hour = showsToday ? Math.max(0, now.getHours() - 1) : 7;
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y: hour * HOUR_HEIGHT, animated: false }), 0);
    return () => clearTimeout(timer);
    // Only when the visible range changes, not every minute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0]?.getTime(), days.length]);

  const segmentsByDay = useMemo(
    () => days.map((day) => layoutDay(day, occurrences)),
    [days, occurrences],
  );

  const allDayByDay = useMemo(
    () =>
      days.map((day) => {
        const dayStart = startOfDay(day).getTime();
        const dayEnd = addDays(day, 1).getTime();
        return occurrences.filter(
          (o) => isAllDayLike(o) && o.start.getTime() < dayEnd && o.end.getTime() > dayStart,
        );
      }),
    [days, occurrences],
  );
  const allDayRows = Math.min(
    MAX_ALL_DAY_ROWS,
    Math.max(0, ...allDayByDay.map((list) => list.length)),
  );

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={[styles.headerRow, { borderColor: colors.border }]}>
        <View style={{ width: GUTTER_WIDTH }} />
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <Pressable
              key={day.getTime()}
              accessibilityRole="button"
              style={styles.dayHeader}
              onPress={() => onPressDay(day)}>
              <Text style={[styles.dayHeaderWeekday, { color: isToday ? colors.primary : colors.text }]}>
                {WEEKDAY_SHORT[day.getDay()].toUpperCase()}
              </Text>
              <View style={[styles.dayHeaderNumber, isToday && { backgroundColor: colors.primary }]}>
                <Text
                  style={[
                    styles.dayHeaderNumberText,
                    { color: isToday ? colors.onPrimary : colors.text },
                  ]}>
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* All-day strip */}
      {allDayRows > 0 && (
        <View style={[styles.allDayRow, { borderColor: colors.border }]}>
          <View style={[styles.gutter, styles.allDayLabel]}>
            <Text style={[styles.hourLabel, { color: colors.text }]}>all-day</Text>
          </View>
          {allDayByDay.map((list, index) => {
            const overflow = list.length > allDayRows;
            const visible = list.slice(0, overflow ? allDayRows - 1 : allDayRows);
            return (
              <View key={index} style={styles.allDayCell}>
                {visible.map((occurrence) => (
                  <Pressable
                    key={occurrence.key}
                    style={[styles.allDayChip, { backgroundColor: occurrence.event.color }]}
                    onPress={() => onPressOccurrence(occurrence)}>
                    <Text numberOfLines={1} style={styles.allDayChipText}>
                      {occurrence.event.title}
                    </Text>
                  </Pressable>
                ))}
                {overflow && (
                  <Pressable onPress={() => onPressDay(days[index])}>
                    <Text style={[styles.more, { color: colors.text }]}>
                      +{list.length - visible.length}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Hour grid */}
      <ScrollView ref={scrollRef} style={styles.container}>
        <View style={[styles.grid, { height: HOUR_HEIGHT * 24 }]}>
          {/* Hour lines are one filled layer behind the day columns. Zero-height
              border-only views don't reliably render on native. */}
          <View pointerEvents="none" style={styles.hourLines}>
            {Array.from({ length: 24 }, (_, hour) => (
              <View
                key={hour}
                style={[styles.hourLine, { top: hour * HOUR_HEIGHT, backgroundColor: colors.border }]}
              />
            ))}
          </View>

          <View style={styles.gutter}>
            {Array.from({ length: 24 }, (_, hour) => (
              <Text
                key={hour}
                style={[
                  styles.hourLabel,
                  styles.hourLabelPositioned,
                  { top: hour * HOUR_HEIGHT - 7, color: colors.text },
                  hour === 0 && styles.hidden,
                ]}>
                {formatHourLabel(hour)}
              </Text>
            ))}
          </View>

          {days.map((day, dayIndex) => (
            <Pressable
              key={day.getTime()}
              style={[styles.dayColumn, { borderColor: colors.border }]}
              onPress={(e) => {
                // Snap the tapped position to the half hour.
                const minutes = Math.floor((e.nativeEvent.locationY / HOUR_HEIGHT) * 2) * 30;
                onPressSlot(addMinutes(startOfDay(day), Math.min(Math.max(minutes, 0), 23 * 60 + 30)));
              }}>
              {segmentsByDay[dayIndex].map(({ occurrence, top, height, column, columns }) => (
                <Pressable
                  key={occurrence.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${occurrence.event.title}, ${formatTime(occurrence.start)}`}
                  onPress={() => onPressOccurrence(occurrence)}
                  style={[
                    styles.event,
                    {
                      top,
                      height: height - 1,
                      left: `${(column / columns) * 100}%`,
                      width: `${100 / columns}%`,
                      backgroundColor: occurrence.event.color,
                      borderColor: colors.background,
                    },
                  ]}>
                  <Text numberOfLines={height > 40 ? 2 : 1} style={styles.eventTitle}>
                    {occurrence.event.title}
                    {height <= 40 && `, ${formatTime(occurrence.start)}`}
                  </Text>
                  {height > 40 && (
                    <Text numberOfLines={1} style={styles.eventMeta}>
                      {formatTime(occurrence.start)} – {formatTime(occurrence.end)}
                    </Text>
                  )}
                  {height > 60 && occurrence.event.location && (
                    <Text numberOfLines={1} style={styles.eventMeta}>
                      {occurrence.event.location}
                    </Text>
                  )}
                </Pressable>
              ))}

              {isSameDay(day, now) && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.nowLine,
                    {
                      top: ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT,
                      backgroundColor: colors.notification,
                    },
                  ]}>
                  <View style={[styles.nowDot, { backgroundColor: colors.notification }]} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderWeekday: {
    fontSize: 11,
    fontWeight: "600",
  },
  dayHeaderNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dayHeaderNumberText: {
    fontSize: 18,
    fontWeight: "500",
  },
  allDayRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  allDayLabel: {
    justifyContent: "center",
  },
  allDayCell: {
    flex: 1,
    paddingHorizontal: 1,
    gap: 2,
  },
  allDayChip: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  allDayChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  more: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: "row",
  },
  gutter: {
    width: GUTTER_WIDTH,
  },
  hourLabel: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: "right",
    paddingRight: 6,
  },
  hourLabelPositioned: {
    position: "absolute",
    right: 0,
  },
  hidden: {
    opacity: 0,
  },
  dayColumn: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  hourLines: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: GUTTER_WIDTH,
    right: 0,
  },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  event: {
    position: "absolute",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: "hidden",
  },
  eventTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  eventMeta: {
    color: "#fff",
    fontSize: 10,
    opacity: 0.9,
  },
  nowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
  },
  nowDot: {
    position: "absolute",
    left: -5,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
