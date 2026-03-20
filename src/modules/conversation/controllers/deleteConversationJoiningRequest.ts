import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isAdminOfConversation, rejectConversationJoiningRequest } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id, user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const requestUserId = req.user.id;

  const isAdmin = await isAdminOfConversation(db, conversation_id, requestUserId);
  if (!isAdmin) return res.status(403).json({ message: 'You are not an admin of this group' });

  await rejectConversationJoiningRequest({ database: db }, { conversation_id, user_id, deleted_by: requestUserId });
  
  return res.status(204).send();
}