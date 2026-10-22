import { File, Paths } from "expo-file-system";

const file = () => new File(Paths.document, "schedule.json");

export function loadSchedule(): string | null {
  try {
    const f = file();
    return f.exists ? f.textSync() : null;
  } catch (error) {
    console.warn("Failed to load schedule", error);
    return null;
  }
}

export function saveSchedule(json: string): void {
  try {
    const f = file();
    if (!f.exists) f.create();
    f.write(json);
  } catch (error) {
    console.warn("Failed to save schedule", error);
  }
}
