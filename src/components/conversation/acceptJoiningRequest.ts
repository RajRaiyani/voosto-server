import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { addMemberToConversation, isAdminOfConversation } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id, user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user.id;

  const request = await db.queryOne('SELECT conversation_id, user_id FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2', [conversation_id, user_id]);
  if (!request) return res.status(404).json({ message: 'Joining request not found' });

  const isAdmin = await isAdminOfConversation(db, conversation_id, userId);
  if (!isAdmin) return res.status(403).json({ message: 'You are not an admin of this group' });

  await addMemberToConversation(db, conversation_id, user_id, false);

  await db.queryOne('DELETE FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2', [conversation_id, user_id]);

  return res.status(204).send();
}