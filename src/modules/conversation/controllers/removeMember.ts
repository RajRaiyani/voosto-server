import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isAdminOfConversation } from '@/modules/conversation/conversation.service.js';
import { removeMemberFromConversation } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id, user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user.id;

  const isAdmin = await isAdminOfConversation(db, conversation_id, userId);
  if (!isAdmin) return res.status(403).json({ message: 'You are not an admin of this group' });
  
  await removeMemberFromConversation({ database: db }, conversation_id, user_id);

  return res.status(204).send();
}