import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { ListUserPosts } from './post.service.js';

export const ValidationSchema = {
  query: z.object({
    user_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { user_id } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  const posts = await ListUserPosts(db, user_id);

  return res.status(200).json(posts);
}