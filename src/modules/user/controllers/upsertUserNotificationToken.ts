import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  body: z.object({
    token: z.string().max(2000),
  }),
};

export const Controller = async (req: Request, res: Response, next: NextFunction, db: DatabaseClient) => {
  const { token } = req.body as z.infer<typeof ValidationSchema.body>;
  const user_id = req.user.id;

  const notificationToken = await db.queryOne(`
    INSERT INTO user_notification_tokens (user_id, token)
    VALUES ($1, $2)
    ON CONFLICT (user_id, token)
    DO NOTHING
    RETURNING *
  `, [user_id, token]);

  res.status(200).json(notificationToken);
};
