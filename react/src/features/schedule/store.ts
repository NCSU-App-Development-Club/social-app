// Client-side schedule store, persisted on device. Swap the storage calls for
// API calls once the backend supports events.

import { useSyncExternalStore } from "react";

import { createId } from "./id";
import type { ParsedCalendar } from "./ical";
import { countStartsBefore } from "./recurrence";
import { loadSchedule, saveSchedule } from "./storage";
import type { ImportedCalendar, ScheduleEvent } from "./types";

export type ScheduleState = {
  events: ScheduleEvent[];
  calendars: ImportedCalendar[];
};

// The fields a user edits in the event form.
export type EventDraft = Omit<ScheduleEvent, "id" | "exceptions" | "overrideOf" | "source">;

// Which occurrences of a repeating event an edit/delete applies to.
export type EditScope = "this" | "following" | "all";

const EMPTY: ScheduleState = { events: [], calendars: [] };

let state: ScheduleState | null = null;
const listeners = new Set<() => void>();

function getState(): ScheduleState {
  if (state === null) {
    const json = loadSchedule();
    try {
      state = json ? { ...EMPTY, ...(JSON.parse(json) as ScheduleState) } : EMPTY;
    } catch {
      state = EMPTY;
    }
  }
  return state;
}

function setState(update: (prev: ScheduleState) => ScheduleState) {
  state = update(getState());
  saveSchedule(JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSchedule(): ScheduleState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useScheduleEvent(id: string | undefined): ScheduleEvent | undefined {
  const { events } = useSchedule();
  return events.find((e) => e.id === id);
}

function replaceEvent(id: string, update: (event: ScheduleEvent) => ScheduleEvent | null) {
  setState((prev) => ({
    ...prev,
    events: prev.events.flatMap((event) => {
      if (event.id !== id) return [event];
      const next = update(event);
      return next ? [next] : [];
    }),
  }));
}

function addEvents(events: ScheduleEvent[]) {
  setState((prev) => ({ ...prev, events: [...prev.events, ...events] }));
}

// ---------------------------------------------------------------------------
// Events

export function createEvent(draft: EventDraft): ScheduleEvent {
  const event: ScheduleEvent = { ...draft, id: createId() };
  addEvents([event]);
  return event;
}

// Ends a series just before `occurrenceStart`, keeping earlier occurrences.
// Returns how many occurrences the series kept.
function truncateSeries(event: ScheduleEvent, occurrenceStart: Date): number {
  const kept = countStartsBefore(event, occurrenceStart);
  replaceEvent(event.id, (e) => ({
    ...e,
    recurrence: e.recurrence && {
      ...e.recurrence,
      until: new Date(occurrenceStart.getTime() - 1).toISOString(),
      count: e.recurrence.count === undefined ? undefined : kept,
    },
    exceptions: e.exceptions?.filter((iso) => new Date(iso) < occurrenceStart),
  }));
  return kept;
}

export function updateOccurrence(
  event: ScheduleEvent,
  occurrenceStart: Date,
  draft: EventDraft,
  scope: EditScope,
): string {
  const isFirst = occurrenceStart.getTime() === new Date(event.start).getTime();

  if (!event.recurrence || (scope === "following" && isFirst)) {
    scope = "all";
  }

  switch (scope) {
    case "this": {
      const override: ScheduleEvent = {
        ...draft,
        recurrence: undefined,
        id: createId(),
        source: event.source,
        overrideOf: { seriesId: event.id, originalStart: occurrenceStart.toISOString() },
      };
      replaceEvent(event.id, (e) => ({
        ...e,
        exceptions: [...(e.exceptions ?? []), occurrenceStart.toISOString()],
      }));
      addEvents([override]);
      return override.id;
    }

    case "following": {
      const kept = truncateSeries(event, occurrenceStart);
      const original = event.recurrence!;
      const recurrence = draft.recurrence && { ...draft.recurrence };
      // If the user left the occurrence count alone, the new series gets what's left.
      if (recurrence?.count !== undefined && recurrence.count === original.count) {
        recurrence.count = Math.max(1, recurrence.count - kept);
      }
      const shift = new Date(draft.start).getTime() - occurrenceStart.getTime();
      const next: ScheduleEvent = {
        ...draft,
        recurrence,
        id: createId(),
        source: event.source,
        exceptions: event.exceptions
          ?.filter((iso) => new Date(iso) >= occurrenceStart)
          .map((iso) => new Date(new Date(iso).getTime() + shift).toISOString()),
      };
      addEvents([next]);
      return next.id;
    }

    case "all": {
      // Apply the time change made to this occurrence to the whole series.
      const shift = new Date(draft.start).getTime() - occurrenceStart.getTime();
      const duration = new Date(draft.end).getTime() - new Date(draft.start).getTime();
      const start = new Date(new Date(event.start).getTime() + shift);
      replaceEvent(event.id, (e) => ({
        ...e,
        ...draft,
        start: start.toISOString(),
        end: new Date(start.getTime() + duration).toISOString(),
        exceptions: draft.recurrence
          ? e.exceptions?.map((iso) => new Date(new Date(iso).getTime() + shift).toISOString())
          : undefined,
      }));
      return event.id;
    }
  }
}

export function deleteOccurrence(event: ScheduleEvent, occurrenceStart: Date, scope: EditScope) {
  const isFirst = occurrenceStart.getTime() === new Date(event.start).getTime();

  if (!event.recurrence || scope === "all" || (scope === "following" && isFirst)) {
    // Deleting a whole series also removes occurrences that were edited separately.
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== event.id && e.overrideOf?.seriesId !== event.id),
    }));
  } else if (scope === "this") {
    replaceEvent(event.id, (e) => ({
      ...e,
      exceptions: [...(e.exceptions ?? []), occurrenceStart.toISOString()],
    }));
  } else {
    truncateSeries(event, occurrenceStart);
  }
}

// ---------------------------------------------------------------------------
// iCal imports

// Importing a calendar with the same link or name replaces the previous import,
// so re-importing an updated class schedule doesn't create duplicates.
export function importCalendar(
  parsed: ParsedCalendar,
  calendarId: string,
  info: { name: string; url?: string },
): ImportedCalendar {
  const calendar: ImportedCalendar = {
    id: calendarId,
    name: parsed.name || info.name,
    url: info.url,
    importedAt: new Date().toISOString(),
  };

  setState((prev) => {
    const replaced = new Set(
      prev.calendars
        .filter((c) => (info.url ? c.url === info.url : c.name === calendar.name))
        .map((c) => c.id),
    );
    return {
      calendars: [...prev.calendars.filter((c) => !replaced.has(c.id)), calendar],
      events: [
        ...prev.events.filter((e) => !e.source || !replaced.has(e.source.calendarId)),
        ...parsed.events,
      ],
    };
  });
  return calendar;
}

export function removeCalendar(calendarId: string) {
  setState((prev) => ({
    calendars: prev.calendars.filter((c) => c.id !== calendarId),
    events: prev.events.filter((e) => e.source?.calendarId !== calendarId),
  }));
}
