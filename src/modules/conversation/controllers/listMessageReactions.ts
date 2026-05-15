import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { listMessageReactions } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
    message_id: Schema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id, message_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user!.id;

  const reactions = await listMessageReactions(db, conversation_id, message_id, userId);

  return res.status(200).json(reactions);
}
