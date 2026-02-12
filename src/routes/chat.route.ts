import express from 'express';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListConversationsSchema, Controller as ListConversationsController } from '@/components/chat/listConversations.js';
import { ValidationSchema as GetConversationSchema, Controller as GetConversationController } from '@/components/chat/getConversation.js';
import { ValidationSchema as CreateConversationSchema, Controller as CreateConversationController } from '@/components/chat/createConversation.js';
import { ValidationSchema as ListMessagesSchema, Controller as ListMessagesController } from '@/components/chat/listMessages.js';
import { ValidationSchema as SendMessageSchema, Controller as SendMessageController } from '@/components/chat/sendMessage.js';
import { ValidationSchema as MarkMessagesSeenSchema, Controller as MarkMessagesSeenController } from '@/components/chat/markMessagesSeen.js';

const router = express.Router();

router
  .route('/')
  .get(isUserLoggedIn, validate(ListConversationsSchema), withDatabase(ListConversationsController))
  .post(isUserLoggedIn, validate(CreateConversationSchema), withDatabase(CreateConversationController));

router
  .route('/:conversation_id')
  .get(isUserLoggedIn, validate(GetConversationSchema), withDatabase(GetConversationController));

router
  .route('/:conversation_id/messages')
  .get(isUserLoggedIn, validate(ListMessagesSchema), withDatabase(ListMessagesController))
  .post(isUserLoggedIn, validate(SendMessageSchema), withDatabase(SendMessageController));

router
  .route('/:conversation_id/messages/seen')
  .patch(isUserLoggedIn, validate(MarkMessagesSeenSchema), withDatabase(MarkMessagesSeenController));

export default router;
