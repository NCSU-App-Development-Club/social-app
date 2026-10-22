import {
  addDays,
  daysInMonth,
  formatShortDate,
  isLastWeekdayOfMonth,
  MONTH_LONG,
  nthWeekdayOfMonth,
  ordinal,
  startOfWeek,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
} from "./date-utils";
import type { Occurrence, RecurrenceRule, ScheduleEvent, Weekday } from "./types";

// Hard stop so a malformed rule can never hang the UI.
const MAX_ITERATIONS = 20_000;

export function occurrenceKey(eventId: string, start: Date): string {
  return `${eventId}|${start.getTime()}`;
}

// The date of the nth `weekday` of a month, or null if it doesn't exist
// (e.g. there is no fifth Monday). Negative nth counts from the end.
function nthWeekdayDate(year: number, month: number, nth: number, weekday: number): number | null {
  const dim = daysInMonth(year, month);
  if (nth > 0) {
    const offset = (weekday - new Date(year, month, 1).getDay() + 7) % 7;
    const day = 1 + offset + (nth - 1) * 7;
    return day <= dim ? day : null;
  }
  const offset = (new Date(year, month, dim).getDay() - weekday + 7) % 7;
  const day = dim - offset + (nth + 1) * 7;
  return day >= 1 ? day : null;
}

// Yields every start time of a recurring event in ascending order, ignoring
// `until`, `count` and exceptions (the caller applies those).
function* candidateStarts(start: Date, rule: RecurrenceRule): Generator<Date> {
  const interval = Math.max(1, rule.interval || 1);
  const at = (y: number, m: number, d: number) =>
    new Date(y, m, d, start.getHours(), start.getMinutes(), start.getSeconds());

  switch (rule.freq) {
    case "daily":
      for (let k = 0; ; k++) {
        const d = addDays(start, k * interval);
        yield at(d.getFullYear(), d.getMonth(), d.getDate());
      }
    case "weekly": {
      const weekdays = [...(rule.byWeekday?.length ? rule.byWeekday : [start.getDay()])].sort();
      const firstWeek = startOfWeek(start);
      for (let k = 0; ; k++) {
        const week = addDays(firstWeek, k * 7 * interval);
        for (const weekday of weekdays) {
          const d = addDays(week, weekday);
          const candidate = at(d.getFullYear(), d.getMonth(), d.getDate());
          if (candidate >= start) yield candidate;
        }
      }
    }
    case "monthly":
      for (let k = 0; ; k++) {
        const monthIndex = start.getMonth() + k * interval;
        const year = start.getFullYear() + Math.floor(monthIndex / 12);
        const month = monthIndex % 12;
        const day = rule.byNthWeekday
          ? nthWeekdayDate(year, month, rule.byNthWeekday.nth, rule.byNthWeekday.weekday)
          : start.getDate() <= daysInMonth(year, month)
            ? start.getDate()
            : null;
        if (day === null) continue;
        const candidate = at(year, month, day);
        if (candidate >= start) yield candidate;
      }
    case "yearly":
      for (let k = 0; ; k++) {
        const year = start.getFullYear() + k * interval;
        // Feb 29 only happens in leap years.
        if (start.getDate() > daysInMonth(year, start.getMonth())) continue;
        yield at(year, start.getMonth(), start.getDate());
      }
  }
}

// Every start time of an event, honoring until/count but not exceptions.
// Stops once a start is at or after `stopAt`.
export function* eventStarts(event: ScheduleEvent, stopAt: Date): Generator<Date> {
  const start = new Date(event.start);
  const rule = event.recurrence;
  if (!rule) {
    if (start < stopAt) yield start;
    return;
  }

  const until = rule.until ? new Date(rule.until).getTime() : Infinity;
  let emitted = 0;
  let iterations = 0;
  for (const candidate of candidateStarts(start, rule)) {
    if (++iterations > MAX_ITERATIONS) return;
    if (candidate >= stopAt || candidate.getTime() > until) return;
    if (rule.count !== undefined && emitted >= rule.count) return;
    emitted++;
    yield candidate;
  }
}

export function expandEvent(event: ScheduleEvent, rangeStart: Date, rangeEnd: Date): Occurrence[] {
  const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
  const excluded = new Set((event.exceptions ?? []).map((iso) => new Date(iso).getTime()));
  const occurrences: Occurrence[] = [];

  for (const start of eventStarts(event, rangeEnd)) {
    const end = new Date(start.getTime() + duration);
    if (end <= rangeStart && !(duration === 0 && start >= rangeStart)) continue;
    if (excluded.has(start.getTime())) continue;
    occurrences.push({ key: occurrenceKey(event.id, start), event, start, end });
  }
  return occurrences;
}

export function expandEvents(
  events: ScheduleEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): Occurrence[] {
  return events
    .flatMap((event) => expandEvent(event, rangeStart, rangeEnd))
    .sort(
      (a, b) =>
        Number(b.event.allDay) - Number(a.event.allDay) ||
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - a.end.getTime(),
    );
}

// Finds a specific occurrence of an event by its start time.
export function findOccurrence(event: ScheduleEvent, startMs: number): Occurrence | null {
  const target = new Date(startMs);
  const [occurrence] = expandEvent(event, target, new Date(startMs + 1));
  return occurrence && occurrence.start.getTime() === startMs ? occurrence : null;
}

// How many occurrences of the series start before `date` (exceptions included,
// since `count` counts them too).
export function countStartsBefore(event: ScheduleEvent, date: Date): number {
  let count = 0;
  for (const _ of eventStarts(event, date)) count++;
  return count;
}

const NTH_LABEL: Record<number, string> = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  5: "fifth",
  [-1]: "last",
};

export function nthWeekdayFor(date: Date): { nth: number; weekday: Weekday } {
  return { nth: nthWeekdayOfMonth(date), weekday: date.getDay() as Weekday };
}

export function lastWeekdayFor(date: Date): { nth: number; weekday: Weekday } | null {
  return isLastWeekdayOfMonth(date) ? { nth: -1, weekday: date.getDay() as Weekday } : null;
}

export function describeNthWeekday(nth: number, weekday: number): string {
  return `${NTH_LABEL[nth] ?? ordinal(nth)} ${WEEKDAY_LONG[weekday]}`;
}

function sameWeekdays(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
}

// Human readable summary, e.g. "Weekly on Mon, Wed, Fri, until Dec 10, 2026".
export function describeRecurrence(rule: RecurrenceRule, start: Date): string {
  const interval = Math.max(1, rule.interval || 1);
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[rule.freq];
  const every = interval === 1 ? null : `Every ${interval} ${unit}s`;
  let text: string;

  switch (rule.freq) {
    case "daily":
      text = every ?? "Daily";
      break;
    case "weekly": {
      const weekdays = rule.byWeekday?.length ? rule.byWeekday : [start.getDay()];
      if (interval === 1 && sameWeekdays(weekdays, [1, 2, 3, 4, 5])) {
        text = "Every weekday (Monday to Friday)";
      } else {
        const days =
          weekdays.length === 1
            ? WEEKDAY_LONG[weekdays[0]]
            : [...weekdays].sort().map((d) => WEEKDAY_SHORT[d]).join(", ");
        text = `${every ?? "Weekly"} on ${days}`;
      }
      break;
    }
    case "monthly":
      text = rule.byNthWeekday
        ? `${every ?? "Monthly"} on the ${describeNthWeekday(rule.byNthWeekday.nth, rule.byNthWeekday.weekday)}`
        : `${every ?? "Monthly"} on day ${start.getDate()}`;
      break;
    case "yearly":
      text = `${every ?? "Annually"} on ${MONTH_LONG[start.getMonth()]} ${start.getDate()}`;
      break;
  }

  if (rule.until) {
    const until = new Date(rule.until);
    text += `, until ${formatShortDate(until)}, ${until.getFullYear()}`;
  } else if (rule.count !== undefined) {
    text += rule.count === 1 ? ", once" : `, ${rule.count} times`;
  }
  return text;
}
