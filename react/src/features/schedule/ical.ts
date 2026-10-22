// A small iCalendar (RFC 5545) parser that covers what school portals, Google
// Calendar, Outlook and Apple Calendar export: VEVENTs with RRULE, EXDATE,
// RECURRENCE-ID overrides, all-day dates, TZID times and DURATION.

import { addDays, MS_PER_DAY } from "./date-utils";
import { createId } from "./id";
import {
  DEFAULT_COLORS,
  EVENT_COLORS,
  type Frequency,
  type RecurrenceRule,
  type ScheduleEvent,
  type ScheduleEventKind,
  type Weekday,
} from "./types";

type Property = {
  name: string;
  params: Record<string, string>;
  value: string;
};

type Component = {
  type: string;
  props: Property[];
  children: Component[];
};

export type ParsedCalendar = {
  name?: string;
  events: ScheduleEvent[];
  // VEVENTs that could not be understood (e.g. missing DTSTART).
  skipped: number;
};

const WEEKDAY_CODES: Record<string, Weekday> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

// Outlook exports Windows zone names instead of IANA ones.
const WINDOWS_TIME_ZONES: Record<string, string> = {
  "Eastern Standard Time": "America/New_York",
  "Central Standard Time": "America/Chicago",
  "Mountain Standard Time": "America/Denver",
  "US Mountain Standard Time": "America/Phoenix",
  "Pacific Standard Time": "America/Los_Angeles",
  "Alaskan Standard Time": "America/Anchorage",
  "Hawaiian Standard Time": "Pacific/Honolulu",
  "GMT Standard Time": "Europe/London",
  "W. Europe Standard Time": "Europe/Berlin",
  "Central European Standard Time": "Europe/Warsaw",
  "India Standard Time": "Asia/Kolkata",
  "China Standard Time": "Asia/Shanghai",
  "Tokyo Standard Time": "Asia/Tokyo",
  UTC: "UTC",
};

// ---------------------------------------------------------------------------
// Lexing

function unfoldLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .filter((line) => line.trim() !== "");
}

// Splits on `separator` but not inside double quotes.
function splitOutsideQuotes(text: string, separator: string, limit = Infinity): string[] {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') quoted = !quoted;
    if (char === separator && !quoted && parts.length < limit - 1) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function parseProperty(line: string): Property | null {
  const [head, value] = splitOutsideQuotes(line, ":", 2);
  if (value === undefined) return null;
  const [name, ...rawParams] = splitOutsideQuotes(head, ";");
  const params: Record<string, string> = {};
  for (const param of rawParams) {
    const eq = param.indexOf("=");
    if (eq === -1) continue;
    params[param.slice(0, eq).toUpperCase()] = param.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params, value };
}

function parseComponents(text: string): Component {
  const root: Component = { type: "ROOT", props: [], children: [] };
  const stack: Component[] = [root];
  for (const line of unfoldLines(text)) {
    const prop = parseProperty(line);
    if (!prop) continue;
    const current = stack[stack.length - 1];
    if (prop.name === "BEGIN") {
      const child: Component = { type: prop.value.trim().toUpperCase(), props: [], children: [] };
      current.children.push(child);
      stack.push(child);
    } else if (prop.name === "END") {
      if (stack.length > 1) stack.pop();
    } else {
      current.props.push(prop);
    }
  }
  return root;
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, char: string) =>
    char === "n" || char === "N" ? "\n" : char,
  );
}

// ---------------------------------------------------------------------------
// Dates

function resolveTimeZone(tzid: string | undefined): string | undefined {
  if (!tzid) return undefined;
  // Some exporters prefix TZIDs with a path, e.g. "/mozilla.org/.../America/New_York".
  const cleaned = tzid.replace(/^\/.*?\/(?=[A-Za-z]+\/[A-Za-z_]+$)/, "");
  return WINDOWS_TIME_ZONES[cleaned] ?? cleaned;
}

// Offset of `timeZone` from UTC at `instant`, in ms.
function timeZoneOffset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(instant / 1000) * 1000;
}

// Converts a wall-clock time in `timeZone` to a Date. Falls back to the
// device's local zone if the zone is unknown.
function zonedTime(
  fields: [number, number, number, number, number, number],
  timeZone: string | undefined,
): Date {
  const [y, mo, d, h, mi, s] = fields;
  if (timeZone) {
    try {
      const guess = Date.UTC(y, mo, d, h, mi, s);
      const offset = timeZoneOffset(guess, timeZone);
      let result = guess - offset;
      const corrected = timeZoneOffset(result, timeZone);
      if (corrected !== offset) result = guess - corrected;
      return new Date(result);
    } catch {
      // Unknown zone; treat as local below.
    }
  }
  return new Date(y, mo, d, h, mi, s);
}

type ParsedDate = { date: Date; allDay: boolean };

function parseDateValue(
  value: string,
  params: Record<string, string>,
  defaultTimeZone: string | undefined,
): ParsedDate | null {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, utc] = match;
  if (h === undefined || params.VALUE === "DATE") {
    return { date: new Date(Number(y), Number(mo) - 1, Number(d)), allDay: true };
  }
  const fields: [number, number, number, number, number, number] = [
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? 0),
  ];
  if (utc) {
    return { date: new Date(Date.UTC(...fields)), allDay: false };
  }
  return {
    date: zonedTime(fields, resolveTimeZone(params.TZID) ?? defaultTimeZone),
    allDay: false,
  };
}

// "P1W", "PT1H30M", "P1DT2H", "-PT15M" -> ms
function parseDuration(value: string): number | null {
  const match = value
    .trim()
    .match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return null;
  const [, sign, w, d, h, m, s] = match;
  const ms =
    Number(w ?? 0) * 7 * MS_PER_DAY +
    Number(d ?? 0) * MS_PER_DAY +
    Number(h ?? 0) * 3_600_000 +
    Number(m ?? 0) * 60_000 +
    Number(s ?? 0) * 1000;
  return sign === "-" ? -ms : ms;
}

// ---------------------------------------------------------------------------
// Recurrence

function parseRRule(
  value: string,
  allDay: boolean,
  defaultTimeZone: string | undefined,
): RecurrenceRule | undefined {
  const parts: Record<string, string> = {};
  for (const part of value.split(";")) {
    const [key, val] = part.split("=");
    if (key && val !== undefined) parts[key.toUpperCase()] = val.toUpperCase();
  }

  const freqMap: Record<string, Frequency> = {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
  };
  let freq = freqMap[parts.FREQ];
  // Hourly/minutely recurrences aren't supported; the first occurrence is kept.
  if (!freq) return undefined;

  const rule: RecurrenceRule = { freq, interval: Math.max(1, Number(parts.INTERVAL) || 1) };

  const byDay = (parts.BYDAY ?? "")
    .split(",")
    .map((code) => code.match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ nth: m[1] ? Number(m[1]) : undefined, weekday: WEEKDAY_CODES[m[2]] }));

  if (byDay.length > 0) {
    if (freq === "daily" && rule.interval === 1) {
      // "FREQ=DAILY;BYDAY=MO,WE,FR" is the same as weekly on those days.
      freq = rule.freq = "weekly";
    }
    if (freq === "weekly") {
      rule.byWeekday = [...new Set(byDay.map((d) => d.weekday))];
    } else if (freq === "monthly") {
      const setPos = parts.BYSETPOS ? Number(parts.BYSETPOS) : undefined;
      const nth = byDay[0].nth ?? setPos;
      if (nth !== undefined) rule.byNthWeekday = { nth, weekday: byDay[0].weekday };
    }
  }

  if (parts.COUNT) rule.count = Math.max(1, Number(parts.COUNT));
  if (parts.UNTIL) {
    // All-day series only care about the date, whatever time the exporter wrote.
    const until = allDay
      ? parseDateValue(parts.UNTIL.slice(0, 8), { VALUE: "DATE" }, defaultTimeZone)
      : parseDateValue(parts.UNTIL, {}, defaultTimeZone);
    if (until) {
      // A date-only UNTIL includes that whole day.
      const inclusiveEnd = until.allDay ? addDays(until.date, 1).getTime() - 1 : until.date.getTime();
      rule.until = new Date(inclusiveEnd).toISOString();
    }
  }
  return rule;
}

// ---------------------------------------------------------------------------
// Classification

const COURSE_CODE = /\b[A-Z]{2,4}\s?-?\d{3}[A-Z]?\b/;
const CLASS_WORDS = /\b(lecture|lab|recitation|seminar|discussion|tutorial|studio|class)\b/i;

function guessKind(title: string, categories: string): ScheduleEventKind {
  if (/class|course|lecture/i.test(categories)) return "class";
  return COURSE_CODE.test(title) || CLASS_WORDS.test(title) ? "class" : "event";
}

// Gives each course its own stable color, e.g. every "CSC 316" block matches.
function colorFor(title: string, kind: ScheduleEventKind): string {
  if (kind !== "class") return DEFAULT_COLORS.event;
  const key = title.match(COURSE_CODE)?.[0] ?? title;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

// ---------------------------------------------------------------------------
// Entry point

export function parseICal(text: string, calendarId: string): ParsedCalendar {
  const root = parseComponents(text);
  const calendar = root.children.find((c) => c.type === "VCALENDAR");
  if (!calendar) {
    throw new Error("This doesn't look like an iCalendar (.ics) file.");
  }

  const calProp = (name: string) => calendar.props.find((p) => p.name === name)?.value;
  const defaultTimeZone = resolveTimeZone(calProp("X-WR-TIMEZONE"));
  const calendarName = calProp("X-WR-CALNAME");

  const series = new Map<string, ScheduleEvent>();
  const overrides: { uid: string; recurrenceId: Date; event: ScheduleEvent | null }[] = [];
  const standalone: ScheduleEvent[] = [];
  let skipped = 0;

  for (const component of calendar.children) {
    if (component.type !== "VEVENT") continue;

    const prop = (name: string) => component.props.find((p) => p.name === name);
    const text = (name: string) => {
      const value = prop(name)?.value;
      return value ? unescapeText(value).trim() : undefined;
    };

    const dtStart = prop("DTSTART");
    const start = dtStart && parseDateValue(dtStart.value, dtStart.params, defaultTimeZone);
    if (!start) {
      skipped++;
      continue;
    }

    const uid = text("UID") ?? createId();
    const cancelled = prop("STATUS")?.value.toUpperCase() === "CANCELLED";
    const recurrenceIdProp = prop("RECURRENCE-ID");
    const recurrenceId =
      recurrenceIdProp &&
      parseDateValue(recurrenceIdProp.value, recurrenceIdProp.params, defaultTimeZone);

    if (cancelled && !recurrenceId) continue;

    let end: Date;
    const dtEnd = prop("DTEND");
    const duration = prop("DURATION");
    const parsedEnd = dtEnd && parseDateValue(dtEnd.value, dtEnd.params, defaultTimeZone);
    const parsedDuration = duration && parseDuration(duration.value);
    if (parsedEnd && parsedEnd.date >= start.date) {
      end = parsedEnd.date;
    } else if (parsedDuration) {
      end = new Date(start.date.getTime() + parsedDuration);
    } else {
      end = start.allDay ? addDays(start.date, 1) : start.date;
    }

    const title = text("SUMMARY") || "(No title)";
    const kind = guessKind(title, text("CATEGORIES") ?? "");
    const event: ScheduleEvent = {
      id: createId(),
      title,
      kind,
      description: text("DESCRIPTION"),
      location: text("LOCATION"),
      color: colorFor(title, kind),
      allDay: start.allDay,
      start: start.date.toISOString(),
      end: end.toISOString(),
      source: { calendarId, uid },
    };

    if (recurrenceId) {
      overrides.push({ uid, recurrenceId: recurrenceId.date, event: cancelled ? null : event });
      continue;
    }

    const rrule = prop("RRULE");
    if (rrule) {
      event.recurrence = parseRRule(rrule.value, start.allDay, defaultTimeZone);
    }

    const exceptions = component.props
      .filter((p) => p.name === "EXDATE")
      .flatMap((p) =>
        p.value.split(",").map((value) => parseDateValue(value, p.params, defaultTimeZone)),
      )
      .filter((d): d is ParsedDate => d !== null)
      .map((d) => d.date.toISOString());
    if (exceptions.length > 0) event.exceptions = exceptions;

    if (event.recurrence) {
      series.set(uid, event);
    } else {
      standalone.push(event);
    }
  }

  // Attach modified/cancelled single occurrences to their series.
  for (const { uid, recurrenceId, event } of overrides) {
    const parent = series.get(uid);
    if (parent) {
      parent.exceptions = [...(parent.exceptions ?? []), recurrenceId.toISOString()];
      if (event) {
        event.overrideOf = { seriesId: parent.id, originalStart: recurrenceId.toISOString() };
      }
    }
    if (event) standalone.push(event);
  }

  return { name: calendarName, events: [...series.values(), ...standalone], skipped };
}
