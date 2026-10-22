// Small date helpers. All math is done in the device's local time zone, so a
// weekly 10:15 class stays at 10:15 across daylight saving changes.

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

// Clamps to the end of the target month (Jan 31 + 1 month = Feb 28/29).
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  result.setDate(Math.min(day, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -day.getDay());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Whole calendar days between two dates, ignoring time of day and DST.
export function diffInDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / MS_PER_DAY);
}

export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours < 12 ? "AM" : "PM";
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${h} ${suffix}`
    : `${h}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// "Tue, Oct 21"
export function formatShortDate(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

// "Tuesday, October 21, 2026"
export function formatLongDate(date: Date): string {
  return `${WEEKDAY_LONG[date.getDay()]}, ${MONTH_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Keeps the time of `base` but takes the calendar date from `picked`.
// Some native date pickers report the chosen day as UTC midnight, so treat an
// exact UTC midnight as a date-only value.
export function withDateOf(base: Date, picked: Date): Date {
  const isUtcMidnight =
    picked.getUTCHours() === 0 && picked.getUTCMinutes() === 0 && picked.getUTCSeconds() === 0;
  const result = new Date(base);
  if (isUtcMidnight) {
    result.setFullYear(picked.getUTCFullYear(), picked.getUTCMonth(), picked.getUTCDate());
  } else {
    result.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  }
  return result;
}

// Keeps the date of `base` but takes the hours/minutes from `picked`.
export function withTimeOf(base: Date, picked: Date): Date {
  const result = new Date(base);
  result.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return result;
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// Which occurrence of its weekday this date is within the month (1-5).
export function nthWeekdayOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

export function isLastWeekdayOfMonth(date: Date): boolean {
  return date.getDate() + 7 > daysInMonth(date.getFullYear(), date.getMonth());
}
