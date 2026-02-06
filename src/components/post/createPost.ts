import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { CreatePost } from './post.service.js';
import Env from '@/config/env.js';

export const ValidationSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    file_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { title, file_id } = req.body as z.infer<typeof ValidationSchema.body>;
  const user_id = req.user.id;

  const file = await db.queryOne(
    'SELECT id, _status FROM files WHERE id = $1',
    [file_id]
  );

  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }

  const existingPost = await db.queryOne(
    'SELECT id FROM user_posts WHERE file_id = $1',
    [file_id]
  );

  if (existingPost) {
    return res.status(400).json({ message: 'File is already used in another post' });
  }

  try {
    await db.query('BEGIN');

    const post = await CreatePost(db, { user_id, title, file_id });

    await db.query('UPDATE files SET _status = $1 WHERE id = $2', ['saved', file_id]);

    await db.query('COMMIT');

    const completePost = await db.queryOne(
      `
      SELECT 
        up.id,
        up.user_id,
        up.title,
        up.file_id,
        up.meta_data,
        
        CASE WHEN f.id IS NOT NULL THEN ($1 || '/' || f.key) ELSE NULL END as file_url,
        f.size as file_size,
        f.mimetype as file_mimetype,
        f._status as file_status,
        f.created_at as created_at
        
      FROM user_posts up
      INNER JOIN files f ON f.id = up.file_id
      WHERE up.id = $2
      `,
      [Env.fileStorageEndpoint, post.id]
    );

    return res.status(201).json(completePost);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}