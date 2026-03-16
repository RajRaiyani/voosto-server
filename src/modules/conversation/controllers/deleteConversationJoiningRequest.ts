import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isAdminOfConversation } from '@/modules/conversation/conversation.service.js';
import ServerEvent from '@/service/event/index.js';

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

  await db.queryOne('DELETE FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2', [conversation_id, user_id]);

  ServerEvent.emit('conversation:conversation_joining_request:deleted', { conversation_id, user_id, deleted_by: requestUserId });

  return res.status(204).send();
}