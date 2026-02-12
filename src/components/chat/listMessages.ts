import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Env from '@/config/env.js';
import { conversationIdParam } from './chat.validation.js';
import { listMessagesQuery } from './chat.validation.js';
import { ensureParticipant } from './chat.service.js';

export const ValidationSchema = {
  params: conversationIdParam,
  query: listMessagesQuery,
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof conversationIdParam>;
  const { offset, limit } = req.validatedQuery as z.infer<typeof listMessagesQuery>;
  const userId = req.user!.id;

  await ensureParticipant(db, conversation_id, userId);

  const messages = await db.namedQueryAll(
    `--sql
    SELECT
      m.id,
      m.conversation_id,
      m.sender_id,
      m.content,
      m.created_at,
      m.seen_at,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'profile_image_url', CASE WHEN f.id IS NOT NULL THEN (CONCAT($file_endpoint, '/', f.key)) ELSE NULL END
      ) AS sender
    FROM messages m
    INNER JOIN users u ON u.id = m.sender_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE m.conversation_id = $conversation_id
    ORDER BY m.created_at DESC
    LIMIT $limit OFFSET $offset
    `,
    { file_endpoint: Env.fileStorageEndpoint, conversation_id, limit, offset }
  );

  return res.status(200).json(messages);
}
