import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { OptionSheet } from "@/features/schedule/components/option-sheet";
import { formatShortDate } from "@/features/schedule/date-utils";
import { parseICal } from "@/features/schedule/ical";
import { createId } from "@/features/schedule/id";
import { readPickedFile } from "@/features/schedule/read-picked-file";
import { importCalendar, removeCalendar, useSchedule } from "@/features/schedule/store";
import type { ImportedCalendar } from "@/features/schedule/types";
import { useAppTheme } from "@/theme/use-app-theme";

// Android file managers often report .ics files as application/octet-stream.
const PICKER_TYPES = Platform.select({
  android: "*/*",
  web: ".ics,text/calendar",
  default: "text/calendar",
});

type Status = { kind: "success" | "error"; message: string } | null;

export default function ImportCalendar() {
  const { colors } = useAppTheme();
  const { calendars, events } = useSchedule();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [removing, setRemoving] = useState<ImportedCalendar | null>(null);

  const runImport = async (load: () => Promise<{ text: string; name: string; url?: string } | null>) => {
    setBusy(true);
    setStatus(null);
    try {
      const loaded = await load();
      if (!loaded) return;
      const calendarId = createId();
      const parsed = parseICal(loaded.text, calendarId);
      if (parsed.events.length === 0) {
        throw new Error("No events were found in that calendar.");
      }
      const calendar = importCalendar(parsed, calendarId, { name: loaded.name, url: loaded.url });
      const repeating = parsed.events.filter((e) => e.recurrence).length;
      setStatus({
        kind: "success",
        message:
          `Imported ${parsed.events.length} event${parsed.events.length === 1 ? "" : "s"} from “${calendar.name}”` +
          (repeating > 0 ? `, including ${repeating} repeating.` : ".") +
          (parsed.skipped > 0 ? ` ${parsed.skipped} couldn't be read and were skipped.` : ""),
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong importing that calendar.",
      });
    } finally {
      setBusy(false);
    }
  };

  const importFile = () =>
    runImport(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return null;
      const asset = result.assets[0];
      if (!/\.(ics|ical|ifb|icalendar)$/i.test(asset.name) && asset.mimeType !== "text/calendar") {
        throw new Error("Please choose an .ics calendar file.");
      }
      return {
        text: await readPickedFile(asset),
        name: asset.name.replace(/\.[^.]+$/, ""),
      };
    });

  const importUrl = () =>
    runImport(async () => {
      const trimmed = url.trim();
      if (!trimmed) return null;
      // Calendar subscription links often use the webcal:// scheme.
      const httpUrl = trimmed.replace(/^webcals?:\/\//i, "https://");
      let response: Response;
      try {
        response = await fetch(httpUrl);
      } catch {
        throw new Error(
          Platform.OS === "web"
            ? "Couldn't download that calendar. The site may block browser requests; try downloading the .ics file instead."
            : "Couldn't download that calendar. Check the link and your connection.",
        );
      }
      if (!response.ok) throw new Error(`The calendar link returned an error (${response.status}).`);
      return { text: await response.text(), name: new URL(httpUrl).hostname, url: trimmed };
    });

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: colors.text }]}>
          Bring in your class schedule or any other calendar. Repeating classes, cancelled meetings
          and one-off changes are kept.
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={importFile}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary },
            (pressed || busy) && { opacity: 0.7 },
          ]}>
          <Text style={[styles.primaryLabel, { color: colors.onPrimary }]}>Choose .ics file</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <Text style={[styles.or, { color: colors.text }]}>or import from a link</Text>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.urlRow}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://… or webcal://…"
            placeholderTextColor={colors.border}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={importUrl}
            style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy || !url.trim()}
            onPress={importUrl}
            style={[styles.secondaryButton, { borderColor: colors.primary }, (busy || !url.trim()) && styles.disabled]}>
            <Text style={[styles.secondaryLabel, { color: colors.primary }]}>Import</Text>
          </Pressable>
        </View>

        {busy && <ActivityIndicator color={colors.primary} />}
        {status && (
          <Text
            style={[
              styles.status,
              { color: status.kind === "error" ? colors.notification : colors.text },
            ]}>
            {status.message}
          </Text>
        )}

        <Text style={[styles.heading, { color: colors.text }]}>Where to find your .ics file</Text>
        <Text style={[styles.help, { color: colors.text }]}>
          • Class schedule: most student portals have an “Export to calendar” or “Download .ics” option
          on the schedule page.{"\n"}• Google Calendar: Settings → your calendar → “Secret address in
          iCal format” (paste it as a link).{"\n"}• Outlook / Apple Calendar: export or share the
          calendar as an .ics file.
        </Text>

        {calendars.length > 0 && (
          <>
            <Text style={[styles.heading, { color: colors.text }]}>Imported calendars</Text>
            <Text style={[styles.help, { color: colors.text }]}>
              Importing the same file or link again replaces it with the latest version.
            </Text>
            {calendars.map((calendar) => {
              const count = events.filter((e) => e.source?.calendarId === calendar.id).length;
              return (
                <View key={calendar.id} style={[styles.calendar, { backgroundColor: colors.card }]}>
                  <View style={styles.flex}>
                    <Text style={[styles.calendarName, { color: colors.text }]} numberOfLines={1}>
                      {calendar.name}
                    </Text>
                    <Text style={[styles.calendarMeta, { color: colors.text }]}>
                      {count} event{count === 1 ? "" : "s"} · imported{" "}
                      {formatShortDate(new Date(calendar.importedAt))}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setRemoving(calendar)}>
                    <Text style={[styles.remove, { color: colors.notification }]}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <OptionSheet
        visible={removing !== null}
        title={`Remove “${removing?.name}”?`}
        message="All events imported from this calendar will be deleted from your schedule."
        options={[{ label: "Remove calendar", value: "remove", destructive: true }]}
        onSelect={() => {
          if (removing) removeCalendar(removing.id);
          setRemoving(null);
        }}
        onClose={() => setRemoving(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  intro: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.8,
  },
  primaryButton: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  or: {
    fontSize: 13,
    opacity: 0.6,
  },
  urlRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.4,
  },
  status: {
    fontSize: 15,
    lineHeight: 21,
  },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
  },
  help: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.75,
  },
  calendar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: "500",
  },
  calendarMeta: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  remove: {
    fontSize: 15,
    fontWeight: "600",
  },
});
