export type Event = {
  id: string;
  eventType: EventType;
  description: string;
  startTime: string;
  endTime: string;
  creatorId: string;
  location: Location;
};

export enum EventType {
  CLASS,
  CUSTOM_EVENT,
}

export type Location = {
  lat: number;
  long: number;
};

export async function getEvent(eventId: string): Promise<Event> {
  return {
    id: eventId,
    eventType: EventType.CLASS,
    description: "event description",
    startTime: "2026-10-08T23:19:43Z",
    endTime: "2026-10-08T23:19:43Z",
    creatorId: "12345",
    location: { lat: 0, long: 0 },
  };
}
