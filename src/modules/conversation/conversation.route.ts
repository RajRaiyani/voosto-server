import express from 'express';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListConversationsSchema, Controller as ListConversationsController } from '@/modules/conversation/controllers/listConversations.js';
import { ValidationSchema as GetConversationSchema, Controller as GetConversationController } from '@/modules/conversation/controllers/getConversation.js';
import { ValidationSchema as UpdateConversationSchema, Controller as UpdateConversationController } from '@/modules/conversation/controllers/updateConversation.js';
import { ValidationSchema as ListMessagesSchema, Controller as ListMessagesController } from '@/modules/conversation/controllers/listMessages.js';
import { ValidationSchema as GetPrivateConversationSchema, Controller as GetPrivateConversationController } from '@/modules/conversation/controllers/getPersonalConversation.js';
import { ValidationSchema as JoinConversationSchema, Controller as JoinConversationController } from '@/modules/conversation/controllers/joinConversation.js';
import { ValidationSchema as AcceptJoiningRequestSchema, Controller as AcceptJoiningRequestController } from '@/modules/conversation/controllers/acceptJoiningRequest.js';
import { ValidationSchema as LeaveConversationSchema, Controller as LeaveConversationController } from '@/modules/conversation/controllers/leaveConversations.js';
import { ValidationSchema as ListConversationJoiningRequestSchema, Controller as ListConversationJoiningRequestController } from '@/modules/conversation/controllers/listConversationJoiningRequest.js';
import { ValidationSchema as DeleteConversationJoiningRequestSchema, Controller as DeleteConversationJoiningRequestController } from '@/modules/conversation/controllers/deleteConversationJoiningRequest.js';
import { ValidationSchema as ListConversationMembersSchema, Controller as ListConversationMembersController } from '@/modules/conversation/controllers/listConversationMemebers.js';
import { ValidationSchema as ListPopularTripConversationsSchema, Controller as ListPopularTripConversationsController } from '@/modules/conversation/controllers/listPopuleTripConversations.js';

const router = express.Router();

router
  .route('/')
  .get(isUserLoggedIn, validate(ListConversationsSchema), withDatabase(ListConversationsController));

router
  .route('/popular-trip-conversations')
  .get(isUserLoggedIn, validate(ListPopularTripConversationsSchema), withDatabase(ListPopularTripConversationsController));

router
  .route('/personal/:user_id')
  .get(isUserLoggedIn, validate(GetPrivateConversationSchema), withDatabase(GetPrivateConversationController));

router
  .route('/:conversation_id')
  .get(isUserLoggedIn, validate(GetConversationSchema), withDatabase(GetConversationController))
  .put(isUserLoggedIn, validate(UpdateConversationSchema), withDatabase(UpdateConversationController));

router
  .route('/:conversation_id/messages')
  .get(isUserLoggedIn, validate(ListMessagesSchema), withDatabase(ListMessagesController));

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
