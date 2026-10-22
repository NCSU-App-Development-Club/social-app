const KEY = "schedule";

export function loadSchedule(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function saveSchedule(json: string): void {
  try {
    globalThis.localStorage?.setItem(KEY, json);
  } catch {
    // Storage can be unavailable (private mode, SSR); the schedule stays in memory.
  }
}
