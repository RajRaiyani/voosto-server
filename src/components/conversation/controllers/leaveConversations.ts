import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isAdminOfConversation, removeMemberFromConversation } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user.id;

  const isAdmin = await isAdminOfConversation(db, conversation_id, userId);
  if (isAdmin) return res.status(400).json({ message: 'Admin can not leave conversation' });

  await removeMemberFromConversation(db, conversation_id, userId);
  
  return res.status(204).send();
}