import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { OptionSheet, type SheetOption } from "@/features/schedule/components/option-sheet";
import { addDays, formatLongDate, formatShortDate, formatTime, isSameDay } from "@/features/schedule/date-utils";
import { describeRecurrence, findOccurrence } from "@/features/schedule/recurrence";
import { deleteOccurrence, useSchedule, type EditScope } from "@/features/schedule/store";
import type { Occurrence } from "@/features/schedule/types";
import { useAppTheme } from "@/theme/use-app-theme";

const SCOPE_OPTIONS: SheetOption<EditScope>[] = [
  { label: "This event", value: "this" },
  { label: "This and following events", value: "following" },
  { label: "All events", value: "all" },
];

function describeWhen({ event, start, end }: Occurrence): string[] {
  if (event.allDay) {
    const lastDay = addDays(end, -1);
    return isSameDay(start, lastDay)
      ? [formatLongDate(start)]
      : [`${formatShortDate(start)} – ${formatShortDate(lastDay)}, ${lastDay.getFullYear()}`];
  }
  if (isSameDay(start, end) || end.getTime() - start.getTime() === 0) {
    return [formatLongDate(start), `${formatTime(start)} – ${formatTime(end)}`];
  }
  return [
    `${formatShortDate(start)}, ${formatTime(start)} –`,
    `${formatShortDate(end)}, ${formatTime(end)}`,
  ];
}

function openMaps(location: string) {
  const query = encodeURIComponent(location);
  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
  void Linking.openURL(url);
}

export default function EventDetails() {
  const { colors } = useAppTheme();
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const { events, calendars } = useSchedule();
  const [deleting, setDeleting] = useState(false);

  const event = events.find((e) => e.id === id);
  const occurrence =
    event &&
    ((start ? findOccurrence(event, Number(start)) : null) ??
      // Fall back to the first occurrence if the requested one no longer exists.
      findOccurrence(event, new Date(event.start).getTime()));

  if (!event || !occurrence) {
    return (
      <Screen edges={["bottom", "left", "right"]} style={styles.missing}>
        <Stack.Screen options={{ title: "" }} />
        <Text style={[styles.missingText, { color: colors.text }]}>
          This event was moved or deleted.
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>Back to calendar</Text>
        </Pressable>
      </Screen>
    );
  }

  const calendar = event.source && calendars.find((c) => c.id === event.source?.calendarId);
  const series = event.overrideOf && events.find((e) => e.id === event.overrideOf?.seriesId);

  const remove = (scope: EditScope) => {
    setDeleting(false);
    deleteOccurrence(event, occurrence.start, scope);
    router.back();
  };

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() =>
                  router.push({
                    pathname: "/schedule/edit",
                    params: { id: event.id, start: String(occurrence.start.getTime()) },
                  })
                }>
                <Text style={[styles.headerAction, { color: colors.primary }]}>Edit</Text>
              </Pressable>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setDeleting(true)}>
                <Text style={[styles.headerAction, { color: colors.notification }]}>Delete</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={[styles.swatch, { backgroundColor: event.color }]} />
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
            {describeWhen(occurrence).map((line) => (
              <Text key={line} style={[styles.when, { color: colors.text }]}>
                {line}
              </Text>
            ))}
            {event.recurrence && (
              <Text style={[styles.when, { color: colors.text }]}>
                {describeRecurrence(event.recurrence, new Date(event.start))}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: colors.card }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {event.kind === "class" ? "Class" : "Event"}
          </Text>
        </View>

        {event.location && (
          <DetailRow glyph="📍" label="Location">
            <Pressable onPress={() => openMaps(event.location!)}>
              <Text style={[styles.value, { color: colors.primary }]}>{event.location}</Text>
            </Pressable>
          </DetailRow>
        )}

        {event.description && (
          <DetailRow glyph="☰" label="Description">
            <Text selectable style={[styles.value, { color: colors.text }]}>
              {event.description}
            </Text>
          </DetailRow>
        )}

        {series && (
          <DetailRow glyph="↻" label="Repeating event">
            <Text style={[styles.value, { color: colors.text }]}>
              This occurrence was edited separately from “{series.title}”.
            </Text>
          </DetailRow>
        )}

        {calendar && (
          <DetailRow glyph="🗓" label="Calendar">
            <Text style={[styles.value, { color: colors.text }]}>
              Imported from {calendar.name}
            </Text>
          </DetailRow>
        )}
      </ScrollView>

      <OptionSheet
        visible={deleting}
        title={event.recurrence ? "Delete recurring event" : "Delete this event?"}
        options={
          event.recurrence ? SCOPE_OPTIONS : [{ label: "Delete", value: "all", destructive: true }]
        }
        onSelect={remove}
        onClose={() => setDeleting(false)}
      />
    </Screen>
  );
}

function DetailRow({
  glyph,
  label,
  children,
}: {
  glyph: string;
  label: string;
  children: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row} accessibilityLabel={label}>
      <Text style={[styles.glyph, { color: colors.text }]}>{glyph}</Text>
      <View style={styles.flex}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
  },
  flex: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 20,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: "600",
  },
  titleRow: {
    flexDirection: "row",
    gap: 16,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 5,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 6,
  },
  when: {
    fontSize: 15,
    opacity: 0.8,
    marginTop: 2,
  },
  badge: {
    alignSelf: "flex-start",
    marginLeft: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  glyph: {
    width: 18,
    textAlign: "center",
    fontSize: 16,
  },
  value: {
    fontSize: 15,
    lineHeight: 21,
  },
  missing: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  missingText: {
    fontSize: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: "600",
  },
});
