import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ServerError from '@/utils/serverError.js';
import Env from '@/config/env.js';
import { createConversationBody } from './chat.validation.js';

export const ValidationSchema = {
  body: createConversationBody,
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { name, is_group, participant_user_ids } = req.body as z.infer<typeof createConversationBody>;
  const userId = req.user!.id;

  const allUserIds = [userId, ...participant_user_ids];
  const uniqueIds = [...new Set(allUserIds)];

  if (uniqueIds.length !== allUserIds.length) {
    throw new ServerError('ERROR', 'Duplicate participants or including yourself in participant list');
  }

  const existingUsers = await db.queryAll(
    'SELECT id FROM users WHERE id = ANY($1::uuid[])',
    [uniqueIds]
  );
  if (existingUsers.length !== uniqueIds.length) {
    throw new ServerError('ERROR', 'One or more participant user ids are invalid');
  }

  const conversationName =
    name?.trim() ||
    (is_group ? 'Group chat' : null);

  if (is_group && !conversationName) {
    throw new ServerError('ERROR', 'Group conversation must have a name');
  }

  const conversation = await db.namedQueryOne(
    `--sql
    INSERT INTO conversations (name, is_group, created_by)
    VALUES ($name, $is_group, $created_by)
    RETURNING id, name, is_group, created_at, created_by, updated_at
    `,
    {
      name: conversationName || 'Direct chat',
      is_group: is_group ?? false,
      created_by: userId,
    }
  );

  const placeholders = uniqueIds
    .map((_, i) => `($1, $${i + 2}, ${i === 0})`)
    .join(', ');
  const params = [conversation!.id, ...uniqueIds];
  await db.query(
    `INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
     VALUES ${placeholders}`,
    params
  );

  const createdByUser = await db.namedQueryOne(
    `SELECT u.id, u.first_name, u.last_name, u.full_name,
            CASE WHEN f.id IS NOT NULL THEN (CONCAT($file_endpoint, '/', f.key)) ELSE NULL END AS profile_image_url
     FROM users u
     LEFT JOIN files f ON f.id = u.profile_image_id
     WHERE u.id = $user_id`,
    { file_endpoint: Env.fileStorageEndpoint, user_id: userId }
  );

  const participants = await db.namedQueryAll(
    `--sql
    SELECT cp.user_id, cp.joined_at, cp.is_admin,
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
    { file_endpoint: Env.fileStorageEndpoint, conversation_id: conversation!.id }
  );

  const payload = {
    ...conversation,
    created_by: createdByUser,
    participants,
  };

  return res.status(201).json(payload);
}
