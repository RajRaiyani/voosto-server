export type ServerEvent = {
  'error': (error: Error) => void;
  'activity:created': (activityId: string) => void;
  'friend_request:created': (payload: { sender_id: string; receiver_id: string }) => void;
  'friend_request:accepted': (payload: { sender_id: string; receiver_id: string }) => void;
  'conversation_joining_request:created': (payload: { conversation_id: string; user_id: string }) => void;
  'conversation_joining_request:accepted': (payload: { conversation_id: string; user_id: string }) => void;
}