export type ScheduleEventKind = "class" | "event";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

// 0 = Sunday ... 6 = Saturday, matching Date#getDay().
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RecurrenceRule = {
  freq: Frequency;
  // Repeat every `interval` days/weeks/months/years.
  interval: number;
  // Weekly only. Defaults to the start date's weekday.
  byWeekday?: Weekday[];
  // Monthly only. e.g. { nth: 3, weekday: 2 } = "third Tuesday", nth -1 = "last".
  // When omitted, monthly repeats on the start date's day of month.
  byNthWeekday?: { nth: number; weekday: Weekday };
  // The series ends at whichever of `until` / `count` comes first. Neither = forever.
  until?: string;
  count?: number;
};

export type ScheduleEvent = {
  id: string;
  title: string;
  kind: ScheduleEventKind;
  description?: string;
  location?: string;
  color: string;
  allDay: boolean;
  // ISO timestamps of the first occurrence. For all-day events the end is exclusive
  // (an event on Oct 5 runs from Oct 5 00:00 to Oct 6 00:00 local time).
  start: string;
  end: string;
  recurrence?: RecurrenceRule;
  // ISO start times of occurrences removed from (or overridden in) the series.
  exceptions?: string[];
  // Set on a single occurrence that was edited separately from its series.
  overrideOf?: { seriesId: string; originalStart: string };
  // Set on events that came from an iCal import.
  source?: { calendarId: string; uid: string };
};

export type ImportedCalendar = {
  id: string;
  name: string;
  // The URL it was fetched from, if it was imported by link.
  url?: string;
  importedAt: string;
};

// A single concrete instance of an event, produced by expanding recurrences.
export type Occurrence = {
  key: string;
  event: ScheduleEvent;
  start: Date;
  end: Date;
};

export const EVENT_COLORS = [
  "#7986CB", // lavender
  "#33B679", // sage
  "#8E24AA", // grape
  "#E67C73", // flamingo
  "#F6BF26", // banana
  "#F4511E", // tangerine
  "#039BE5", // peacock
  "#616161", // graphite
  "#3F51B5", // blueberry
  "#0B8043", // basil
  "#D50000", // tomato
] as const;

export const DEFAULT_COLORS: Record<ScheduleEventKind, string> = {
  class: "#039BE5",
  event: "#7986CB",
};
