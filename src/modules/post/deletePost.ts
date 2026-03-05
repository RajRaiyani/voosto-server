import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { GetPostById } from './post.service.js';
import { DeleteFile } from '@/modules/file/file.service.js';

export const ValidationSchema = {
  params: z.object({
    post_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { post_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const user_id = req.user.id;

  const post = await GetPostById(db, post_id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.user.id !== user_id) return res.status(403).json({ message: 'You are not allowed to delete this post' });

  try {
    await db.begin();

    await db.query('DELETE FROM user_posts WHERE id = $1', [post_id]);
    await DeleteFile(db, post.file.id);

    await db.commit();

    return res.status(204).send();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}