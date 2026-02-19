import express from 'express';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListConversationsSchema, Controller as ListConversationsController } from '@/components/conversation/listConversations.js';
import { ValidationSchema as GetConversationSchema, Controller as GetConversationController } from '@/components/conversation/getConversation.js';
import { ValidationSchema as UpdateConversationSchema, Controller as UpdateConversationController } from '@/components/conversation/updateConversation.js';
import { ValidationSchema as ListMessagesSchema, Controller as ListMessagesController } from '@/components/conversation/listMessages.js';
import { ValidationSchema as SendMessageSchema, Controller as SendMessageController } from '@/components/conversation/sendMessage.js';
import { ValidationSchema as GetPrivateConversationSchema, Controller as GetPrivateConversationController } from '@/components/conversation/getPersonalConversation.js';
import { ValidationSchema as JoinConversationSchema, Controller as JoinConversationController } from '@/components/conversation/joinConversation.js';
import { ValidationSchema as AcceptJoiningRequestSchema, Controller as AcceptJoiningRequestController } from '@/components/conversation/acceptJoiningRequest.js';
import { ValidationSchema as LeaveConversationSchema, Controller as LeaveConversationController } from '@/components/conversation/leaveConversations.js';
import imageUpload from '@/middleware/multer/imageUpload.js';
import { ValidationSchema as ListConversationJoiningRequestSchema, Controller as ListConversationJoiningRequestController } from '@/components/conversation/listConversationJoiningRequest.js';
import { ValidationSchema as DeleteConversationJoiningRequestSchema, Controller as DeleteConversationJoiningRequestController } from '@/components/conversation/deleteConversationJoiningRequest.js';
import { ValidationSchema as ListConversationMembersSchema, Controller as ListConversationMembersController } from '@/components/conversation/listConversationMemebers.js';

const router = express.Router();

router
  .route('/')
  .get(isUserLoggedIn, validate(ListConversationsSchema), withDatabase(ListConversationsController));

router
  .route('/personal/:user_id')
  .get(isUserLoggedIn, validate(GetPrivateConversationSchema), withDatabase(GetPrivateConversationController));

router
  .route('/:conversation_id')
  .get(isUserLoggedIn, validate(GetConversationSchema), withDatabase(GetConversationController))
  .put(isUserLoggedIn, validate(UpdateConversationSchema), withDatabase(UpdateConversationController));

router
  .route('/:conversation_id/messages')
  .get(isUserLoggedIn, validate(ListMessagesSchema), withDatabase(ListMessagesController))
  .post(isUserLoggedIn, imageUpload.array('files', 10), validate(SendMessageSchema), withDatabase(SendMessageController));

router
  .route('/:conversation_id/join')
  .post(isUserLoggedIn, validate(JoinConversationSchema), withDatabase(JoinConversationController));

router
  .route('/:conversation_id/leave')
  .post(isUserLoggedIn, validate(LeaveConversationSchema), withDatabase(LeaveConversationController));

router
  .route('/:conversation_id/join-requests')
  .get(isUserLoggedIn, validate(ListConversationJoiningRequestSchema), withDatabase(ListConversationJoiningRequestController));

router
  .route('/:conversation_id/join-request/:user_id/accept')
  .post(isUserLoggedIn, validate(AcceptJoiningRequestSchema), withDatabase(AcceptJoiningRequestController));

router
  .route('/:conversation_id/join-request/:user_id/delete')
  .delete(isUserLoggedIn, validate(DeleteConversationJoiningRequestSchema), withDatabase(DeleteConversationJoiningRequestController));

router
  .route('/:conversation_id/members')
  .get(isUserLoggedIn, validate(ListConversationMembersSchema), withDatabase(ListConversationMembersController));

export default router;
