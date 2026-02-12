import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Env from '@/config/env.js';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;
  const userId = req.user!.id;

  const conversations = await db.namedQueryAll(
    `--sql
    WITH last_msg AS (
      SELECT DISTINCT ON (conversation_id)
        conversation_id,
        id AS last_message_id,
        content AS last_message_content,
        created_at AS last_message_at,
        sender_id AS last_message_sender_id
      FROM messages
      ORDER BY conversation_id, created_at DESC
    )
    SELECT
      c.id,
      c.name,
      c.is_group,
      c.created_at,
      c.updated_at,
      json_build_object(
        'id', creator.id,
        'first_name', creator.first_name,
        'last_name', creator.full_name,
        'profile_image_url', CASE WHEN f_creator.id IS NOT NULL THEN (CONCAT($file_endpoint, '/', f_creator.key)) ELSE NULL END
      ) AS created_by,
      json_build_object(
        'id', lm.last_message_id,
        'content', lm.last_message_content,
        'created_at', lm.last_message_at,
        'sender_id', lm.last_message_sender_id
      ) AS last_message
    FROM conversation_participants cp
    INNER JOIN conversations c ON c.id = cp.conversation_id
    LEFT JOIN users creator ON creator.id = c.created_by
    LEFT JOIN files f_creator ON f_creator.id = creator.profile_image_id
    LEFT JOIN last_msg lm ON lm.conversation_id = c.id
    WHERE cp.user_id = $user_id
    ORDER BY COALESCE(lm.last_message_at, c.created_at) DESC
    LIMIT $limit OFFSET $offset
    `,
    { file_endpoint: Env.fileStorageEndpoint, user_id: userId, limit, offset }
  );

  return res.status(200).json(conversations);
}
