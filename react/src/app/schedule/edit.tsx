import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { DateField } from "@/features/schedule/components/date-field";
import { OptionSheet, type SheetOption } from "@/features/schedule/components/option-sheet";
import {
  addDays,
  addMinutes,
  MONTH_LONG,
  startOfDay,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
} from "@/features/schedule/date-utils";
import {
  describeNthWeekday,
  describeRecurrence,
  findOccurrence,
  lastWeekdayFor,
  nthWeekdayFor,
} from "@/features/schedule/recurrence";
import {
  createEvent,
  updateOccurrence,
  useSchedule,
  type EditScope,
  type EventDraft,
} from "@/features/schedule/store";
import {
  DEFAULT_COLORS,
  EVENT_COLORS,
  type Frequency,
  type RecurrenceRule,
  type ScheduleEventKind,
  type Weekday,
} from "@/features/schedule/types";
import { useAppTheme } from "@/theme/use-app-theme";

type RepeatPreset =
  | "none"
  | "daily"
  | "weekly"
  | "weekdays"
  | "monthlyDay"
  | "monthlyNth"
  | "monthlyLast"
  | "yearly";

function presetRule(preset: RepeatPreset, start: Date): RecurrenceRule | undefined {
  switch (preset) {
    case "none":
      return undefined;
    case "daily":
      return { freq: "daily", interval: 1 };
    case "weekly":
      return { freq: "weekly", interval: 1, byWeekday: [start.getDay() as Weekday] };
    case "weekdays":
      return { freq: "weekly", interval: 1, byWeekday: [1, 2, 3, 4, 5] };
    case "monthlyDay":
      return { freq: "monthly", interval: 1 };
    case "monthlyNth":
      return { freq: "monthly", interval: 1, byNthWeekday: nthWeekdayFor(start) };
    case "monthlyLast":
      return { freq: "monthly", interval: 1, byNthWeekday: lastWeekdayFor(start) ?? undefined };
    case "yearly":
      return { freq: "yearly", interval: 1 };
  }
}

function presetOptions(start: Date): SheetOption<RepeatPreset>[] {
  const nth = nthWeekdayFor(start);
  const last = lastWeekdayFor(start);
  return [
    { label: "Does not repeat", value: "none" },
    { label: "Every day", value: "daily" },
    { label: `Weekly on ${WEEKDAY_LONG[start.getDay()]}`, value: "weekly" },
    { label: "Every weekday (Monday to Friday)", value: "weekdays" },
    { label: `Monthly on day ${start.getDate()}`, value: "monthlyDay" },
    ...(nth.nth <= 4
      ? [{ label: `Monthly on the ${describeNthWeekday(nth.nth, nth.weekday)}`, value: "monthlyNth" as const }]
      : []),
    ...(last
      ? [{ label: `Monthly on the ${describeNthWeekday(-1, last.weekday)}`, value: "monthlyLast" as const }]
      : []),
    { label: `Annually on ${MONTH_LONG[start.getMonth()]} ${start.getDate()}`, value: "yearly" },
  ];
}

const UNIT_LABELS: Record<Frequency, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

type EndMode = "never" | "until" | "count";

function sameRule(a: RecurrenceRule | undefined, b: RecurrenceRule | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function roundUpToHour(date: Date): Date {
  const result = new Date(date);
  result.setMinutes(0, 0, 0);
  return result < date ? addMinutes(result, 60) : result;
}

export default function EditEvent() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string; start?: string; date?: string }>();
  const { events } = useSchedule();

  const existing = params.id ? events.find((e) => e.id === params.id) : undefined;
  const occurrence =
    existing && params.start ? findOccurrence(existing, Number(params.start)) : null;

  // Form state is initialised once from the event (or the tapped slot for new events).
  const [initial] = useState(() => {
    if (existing) {
      const start = occurrence?.start ?? new Date(existing.start);
      const end = occurrence?.end ?? new Date(existing.end);
      return {
        ...existing,
        start,
        // The form shows the last day of an all-day event, not the exclusive end.
        end: existing.allDay ? addDays(end, -1) : end,
      };
    }
    const start = params.date ? new Date(Number(params.date)) : roundUpToHour(new Date());
    return {
      title: "",
      kind: "event" as ScheduleEventKind,
      description: "",
      location: "",
      color: DEFAULT_COLORS.event,
      allDay: false,
      start,
      end: addMinutes(start, 60),
      recurrence: undefined as RecurrenceRule | undefined,
    };
  });

  const [title, setTitle] = useState(initial.title);
  const [kind, setKind] = useState<ScheduleEventKind>(initial.kind);
  const [color, setColor] = useState(initial.color);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [location, setLocation] = useState(initial.location ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [rule, setRule] = useState<RecurrenceRule | undefined>(initial.recurrence);
  const [repeatSheet, setRepeatSheet] = useState(false);
  const [scopeSheet, setScopeSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endMode: EndMode = rule?.until ? "until" : rule?.count !== undefined ? "count" : "never";

  const changeStart = (next: Date) => {
    // Keep the duration, like Google Calendar does.
    setEnd(new Date(end.getTime() + (next.getTime() - start.getTime())));
    // Keep "weekly on <day>" / "monthly on the nth <day>" in step with the new date.
    if (rule?.freq === "weekly" && rule.byWeekday?.length === 1 && rule.byWeekday[0] === start.getDay()) {
      setRule({ ...rule, byWeekday: [next.getDay() as Weekday] });
    } else if (rule?.freq === "monthly" && rule.byNthWeekday) {
      setRule({
        ...rule,
        byNthWeekday:
          rule.byNthWeekday.nth === -1 ? (lastWeekdayFor(next) ?? nthWeekdayFor(next)) : nthWeekdayFor(next),
      });
    }
    setStart(next);
  };

  const changeKind = (next: ScheduleEventKind) => {
    if (color === DEFAULT_COLORS[kind]) setColor(DEFAULT_COLORS[next]);
    setKind(next);
  };

  const buildDraft = (): EventDraft | null => {
    const draftStart = allDay ? startOfDay(start) : start;
    const draftEnd = allDay ? addDays(startOfDay(end), 1) : end;
    if (draftEnd < draftStart) {
      setError("The event ends before it starts.");
      return null;
    }
    if (rule?.until && new Date(rule.until) < draftStart) {
      setError("The repeat end date is before the event starts.");
      return null;
    }
    return {
      title: title.trim() || "(No title)",
      kind,
      color,
      allDay,
      start: draftStart.toISOString(),
      end: draftEnd.toISOString(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      recurrence: rule,
    };
  };

  const finish = (draft: EventDraft, scope: EditScope) => {
    if (!existing) {
      createEvent(draft);
      router.back();
      return;
    }
    const id = updateOccurrence(existing, occurrence?.start ?? new Date(existing.start), draft, scope);
    router.back();
    // Point the details screen at the (possibly new) event.
    router.setParams({ id, start: String(new Date(draft.start).getTime()) });
  };

  const save = () => {
    const draft = buildDraft();
    if (!draft) return;
    if (existing?.recurrence) {
      setScopeSheet(true);
    } else {
      finish(draft, "all");
    }
  };

  const ruleChanged = !sameRule(rule, existing?.recurrence);
  const scopeOptions: SheetOption<EditScope>[] = [
    // Changing the repeat rule only makes sense for the series, as in Google Calendar.
    ...(ruleChanged ? [] : [{ label: "This event", value: "this" as const }]),
    { label: "This and following events", value: "following" },
    { label: "All events", value: "all" },
  ];

  const setUnit = (freq: Frequency) => {
    if (!rule) return;
    setRule({
      freq,
      interval: rule.interval,
      until: rule.until,
      count: rule.count,
      byWeekday: freq === "weekly" ? [start.getDay() as Weekday] : undefined,
    });
  };

  const toggleWeekday = (day: Weekday) => {
    if (!rule) return;
    const current = rule.byWeekday?.length ? rule.byWeekday : [start.getDay() as Weekday];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    if (next.length === 0) return;
    setRule({ ...rule, byWeekday: next.sort() });
  };

  const setEndMode = (mode: EndMode) => {
    if (!rule) return;
    const { until: _until, count: _count, ...rest } = rule;
    if (mode === "never") setRule(rest);
    if (mode === "count") setRule({ ...rest, count: 10 });
    if (mode === "until") {
      const untilDay = addDays(startOfDay(start), rule.freq === "daily" ? 30 : 120);
      setRule({ ...rest, until: endOfDay(untilDay).toISOString() });
    }
  };

  const inputStyle = [styles.input, { color: colors.text, backgroundColor: colors.card }];

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          title: existing ? "Edit event" : "New event",
          headerRight: () => (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={save}>
              <Text style={[styles.save, { color: colors.primary }]}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Add title"
            placeholderTextColor={colors.border}
            autoFocus={!existing}
            style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
          />

          <Segmented
            options={[
              { label: "Event", value: "event" },
              { label: "Class", value: "class" },
            ]}
            value={kind}
            onChange={changeKind}
          />

          <Section>
            <Row label="All-day">
              <Switch
                value={allDay}
                onValueChange={setAllDay}
                trackColor={{ true: colors.primary }}
              />
            </Row>
            <Row label="Starts">
              <View style={styles.dateFields}>
                <DateField value={start} mode="date" onChange={changeStart} />
                {!allDay && <DateField value={start} mode="time" onChange={changeStart} />}
              </View>
            </Row>
            <Row label="Ends">
              <View style={styles.dateFields}>
                <DateField value={end} mode="date" onChange={setEnd} />
                {!allDay && <DateField value={end} mode="time" onChange={setEnd} />}
              </View>
            </Row>
          </Section>

          <Section>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRepeatSheet(true)}
              style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Repeat</Text>
              <Text style={[styles.rowValue, { color: colors.primary }]} numberOfLines={2}>
                {rule ? describeRecurrence(rule, start) : "Does not repeat"}
              </Text>
            </Pressable>

            {rule && (
              <>
                <Row label="Every">
                  <View style={styles.inline}>
                    <TextInput
                      value={String(rule.interval)}
                      onChangeText={(text) =>
                        setRule({ ...rule, interval: Math.max(1, Number(text.replace(/\D/g, "")) || 1) })
                      }
                      keyboardType="number-pad"
                      style={[inputStyle, styles.numberInput]}
                    />
                    <Segmented
                      compact
                      options={(Object.keys(UNIT_LABELS) as Frequency[]).map((freq) => ({
                        label: UNIT_LABELS[freq] + (rule.interval > 1 ? "s" : ""),
                        value: freq,
                      }))}
                      value={rule.freq}
                      onChange={setUnit}
                    />
                  </View>
                </Row>

                {rule.freq === "weekly" && (
                  <View style={styles.weekdays}>
                    {WEEKDAY_SHORT.map((label, index) => {
                      const day = index as Weekday;
                      const selected = (rule.byWeekday?.length ? rule.byWeekday : [start.getDay()]).includes(day);
                      return (
                        <Pressable
                          key={label}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={WEEKDAY_LONG[day]}
                          onPress={() => toggleWeekday(day)}
                          style={[
                            styles.weekday,
                            { borderColor: colors.border },
                            selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}>
                          <Text style={{ color: selected ? colors.onPrimary : colors.text }}>
                            {label[0]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {rule.freq === "monthly" && (
                  <Segmented
                    options={[
                      { label: `Day ${start.getDate()}`, value: "day" },
                      {
                        label: `${describeNthWeekday(nthWeekdayFor(start).nth, start.getDay())}`,
                        value: "nth",
                      },
                      ...(lastWeekdayFor(start)
                        ? [{ label: describeNthWeekday(-1, start.getDay()), value: "last" }]
                        : []),
                    ]}
                    value={
                      !rule.byNthWeekday ? "day" : rule.byNthWeekday.nth === -1 ? "last" : "nth"
                    }
                    onChange={(mode) =>
                      setRule({
                        ...rule,
                        byNthWeekday:
                          mode === "day"
                            ? undefined
                            : mode === "last"
                              ? (lastWeekdayFor(start) ?? undefined)
                              : nthWeekdayFor(start),
                      })
                    }
                  />
                )}

                <Row label="Ends">
                  <Segmented
                    compact
                    options={[
                      { label: "Never", value: "never" },
                      { label: "On", value: "until" },
                      { label: "After", value: "count" },
                    ]}
                    value={endMode}
                    onChange={setEndMode}
                  />
                </Row>
                {endMode === "until" && (
                  <Row label="End date">
                    <DateField
                      value={new Date(rule.until!)}
                      mode="date"
                      onChange={(date) => setRule({ ...rule, until: endOfDay(date).toISOString() })}
                    />
                  </Row>
                )}
                {endMode === "count" && (
                  <Row label="Occurrences">
                    <TextInput
                      value={String(rule.count)}
                      onChangeText={(text) =>
                        setRule({ ...rule, count: Math.max(1, Number(text.replace(/\D/g, "")) || 1) })
                      }
                      keyboardType="number-pad"
                      style={[inputStyle, styles.numberInput]}
                    />
                  </Row>
                )}
              </>
            )}
          </Section>

          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Add location"
            placeholderTextColor={colors.border}
            style={inputStyle}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add description"
            placeholderTextColor={colors.border}
            multiline
            style={[inputStyle, styles.description]}
          />

          <View style={styles.colors}>
            {EVENT_COLORS.map((swatch) => (
              <Pressable
                key={swatch}
                accessibilityRole="radio"
                accessibilityState={{ selected: swatch === color }}
                accessibilityLabel={`Color ${swatch}`}
                onPress={() => setColor(swatch)}
                style={[
                  styles.swatch,
                  { backgroundColor: swatch },
                  swatch === color && { borderColor: colors.text, borderWidth: 3 },
                ]}
              />
            ))}
          </View>

          {error && <Text style={[styles.error, { color: colors.notification }]}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionSheet
        visible={repeatSheet}
        title="Repeat"
        options={presetOptions(start)}
        selected={
          presetOptions(start).find((option) => sameRule(presetRule(option.value, start), rule))
            ?.value ?? (rule ? undefined : "none")
        }
        onSelect={(preset) => {
          setRule(presetRule(preset, start));
          setRepeatSheet(false);
        }}
        onClose={() => setRepeatSheet(false)}
      />

      <OptionSheet
        visible={scopeSheet}
        title="Save recurring event"
        options={scopeOptions}
        onSelect={(scope) => {
          setScopeSheet(false);
          const draft = buildDraft();
          if (draft) finish(draft, scope);
        }}
        onClose={() => setScopeSheet(false)}
      />
    </Screen>
  );
}

function endOfDay(date: Date): Date {
  return new Date(addDays(startOfDay(date), 1).getTime() - 1);
}

function Section({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={[styles.section, { borderColor: colors.border }]}>{children}</View>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  compact,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.segmented, { borderColor: colors.border }, compact && styles.compact]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}>
            <Text
              numberOfLines={1}
              style={[styles.segmentLabel, { color: selected ? colors.onPrimary : colors.text }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  save: {
    fontSize: 16,
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 24,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 15,
    flexShrink: 1,
    textAlign: "right",
  },
  dateFields: {
    flexDirection: "row",
    gap: 8,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  input: {
    fontSize: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  numberInput: {
    width: 56,
    textAlign: "center",
  },
  description: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  weekdays: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  weekday: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  compact: {
    flexShrink: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  colors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: "transparent",
  },
  error: {
    fontSize: 14,
  },
});
