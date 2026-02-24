import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { ensureMember, listConversationMessages } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
  query: z.object({
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
    search: z.string().trim().max(200, 'Search must be less than 200 characters').optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { offset, limit, search } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;
  const userId = req.user!.id;

  await ensureMember(db, conversation_id, userId);

  const messages = await listConversationMessages(db, conversation_id, { offset, limit, search });

  return res.status(200).json(messages);
}
