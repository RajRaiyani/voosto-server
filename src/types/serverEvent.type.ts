export type ServerEvent = {
  'error': (error: Error) => void;
  'activity:created': (activityId: string) => void;
  'friend_request:created': (friendRequestId: string) => void;
  'friend_request:accepted': (friendRequestId: string) => void;
  'conversation_joining_request:created': (conversationJoiningRequestId: string) => void;
  'conversation_joining_request:accepted': (conversationJoiningRequestId: string) => void;
}