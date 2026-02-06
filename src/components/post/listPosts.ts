import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { ListUserPosts } from './post.service.js';

export const ValidationSchema = {
  query: z.object({
    user_id: ConfigValidationSchema.uuid().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  // If user_id is provided in query, use it; otherwise use logged-in user's ID
  const user_id = req.validatedQuery?.user_id || req.user.id;

  // Verify user exists if user_id was provided in query
  if (req.validatedQuery?.user_id) {
    const user = await db.queryOne('SELECT id FROM users WHERE id = $1', [user_id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  }

  const posts = await ListUserPosts(db, user_id);

  return res.status(200).json(posts);
}