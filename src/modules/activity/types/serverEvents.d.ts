/**
 * File module server events. Merged into global ServerEvents (no import in central types).
 */
declare global {
  interface ServerEvents {
    'activity:created': (activityId: string) => void;
  }
}

export {};
