import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';

export const ValidationSchema = {
  params: z.object({
    user_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const blocker_id = req.user.id;

  if (blocker_id === user_id) {
    return res.status(400).json({ message: 'You cannot block yourself' });
  }

  const existingUser = await db.queryOne('SELECT id FROM users WHERE id = $1', [user_id]);
  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const existingBlock = await db.queryOne(
    `
    SELECT blocker_id, blocked_id
    FROM blocked_users
    WHERE blocker_id = $1 AND blocked_id = $2
  `,
    [blocker_id, user_id]
  );

  if (existingBlock) {
    return res.status(400).json({ message: 'User is already blocked' });
  }

  const block = await db.queryOne(
    `
    INSERT INTO blocked_users (blocker_id, blocked_id)
    VALUES ($1, $2)
    RETURNING blocker_id, blocked_id, created_at
  `,
    [blocker_id, user_id]
  );

  return res.status(201).json(block);
}

