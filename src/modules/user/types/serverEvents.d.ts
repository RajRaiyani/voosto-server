/**
 * File module server events. Merged into global ServerEvents (no import in central types).
 */
declare global {
  interface ServerEvents {
    'user:friend_request:created': (payload: { sender_id: string; receiver_id: string }) => void;
    'user:friend_request:accepted': (payload: { sender_id: string; receiver_id: string }) => void;
    'user:friend_request:rejected': (payload: { sender_id: string; receiver_id: string }) => void;
  }
}

export {};
