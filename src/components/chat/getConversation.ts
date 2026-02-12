import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import Env from '@/config/env.js';
import { conversationIdParam } from './chat.validation.js';
import { ensureParticipant, getConversationById } from './chat.service.js';

export const ValidationSchema = {
  params: conversationIdParam,
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof conversationIdParam>;
  const userId = req.user!.id;

  const exists = await getConversationById(db, conversation_id);
  if (!exists) {
    return res.status(404).json({ message: 'Conversation not found' });
  }
  await ensureParticipant(db, conversation_id, userId);

  const conversation = await db.namedQueryOne(
    `--sql
    SELECT
      c.id,
      c.name,
      c.is_group,
      c.created_at,
      c.updated_at,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'profile_image_url', CASE WHEN f.id IS NOT NULL THEN (CONCAT($file_endpoint, '/', f.key)) ELSE NULL END
      ) AS created_by
    FROM conversations c
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE c.id = $conversation_id
    `,
    { file_endpoint: Env.fileStorageEndpoint, conversation_id }
  );

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const participants = await db.namedQueryAll(
    `--sql
    SELECT
      cp.user_id,
      cp.joined_at,
      cp.is_admin,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'profile_image_url', CASE WHEN f.id IS NOT NULL THEN (CONCAT($file_endpoint, '/', f.key)) ELSE NULL END
      ) AS user
    FROM conversation_participants cp
    INNER JOIN users u ON u.id = cp.user_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE cp.conversation_id = $conversation_id
    ORDER BY cp.joined_at ASC
    `,
    { file_endpoint: Env.fileStorageEndpoint, conversation_id }
  );

  return res.status(200).json({ ...conversation, participants });
}
