export interface Notification {
  title: string;
  body: string;
  type: 'new_activity' | 'new_friend_request' | 'friend_request_accepted' | 'new_message' | 'new_conversation_joining_request' | 'conversation_joining_request_accepted';
  [key: string]: string ;
}

export * from './sendMessage.js';
