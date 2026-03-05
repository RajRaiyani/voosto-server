import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { getPersonalConversation, createConversation, getConversationById } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    user_id: Schema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const requestUserId = req.user.id;


  let existingConversation = await getPersonalConversation(db, requestUserId, user_id);

  if (!existingConversation) {
    existingConversation = await createConversation(db, {
      name: null,
      is_group: false,
      is_private: false,
      is_womans_only: false,
      members: [{ id: requestUserId, is_admin: false, notification_enabled: true }, { id: user_id, is_admin: false, notification_enabled: true }],
    });
  }

  const conversation = await getConversationById(db, existingConversation.id, requestUserId);

  return res.status(200).json(conversation);
}
