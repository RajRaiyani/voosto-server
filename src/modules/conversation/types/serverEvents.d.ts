/**
 * File module server events. Merged into global ServerEvents (no import in central types).
 */
declare global {
  interface ServerEvents {
    'conversation:conversation_joining_request:created': (payload: { conversation_id: string; user_id: string }) => void;
    'conversation:conversation_joining_request:accepted': (payload: { conversation_id: string; user_id: string }) => void;
  }
}

export {};
