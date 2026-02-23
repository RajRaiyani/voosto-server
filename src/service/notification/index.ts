export enum NotificationType {
  NEW_ACTIVITY = 'new_activity',
  NEW_FRIEND_REQUEST = 'new_friend_request',
  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
  NEW_MESSAGE = 'new_message',
  NEW_CONVERSATION_JOINING_REQUEST = 'new_conversation_joining_request',
  CONVERSATION_JOINING_REQUEST_ACCEPTED = 'conversation_joining_request_accepted'
}

export interface Notification {
  title: string;
  body: string;
  type: NotificationType;
  [key: string]: string ;
}

export * from './sendMessage.js';
