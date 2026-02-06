import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { DeletePost } from './post.service.js';
import { deleteFile } from '@/service/file-storage/index.js';

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

  const post = await DeletePost(db, post_id, user_id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found or you do not have permission to delete it' });
  }

  try {
    await db.query('BEGIN');

    await db.query('DELETE FROM user_posts WHERE id = $1', [post_id]);

    await db.query('DELETE FROM files WHERE id = $1', [post.file_id]);

    try {
      await deleteFile(post.file_key);
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
    }

    await db.query('COMMIT');

    return res.status(200).json({ 
      message: 'Post deleted successfully',
      post_id: post_id 
    });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}