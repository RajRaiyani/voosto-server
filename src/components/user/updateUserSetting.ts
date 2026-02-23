import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  body: z.object({
    notify_near_by_activities: z.boolean().default(true),
    hide_my_distance: z.boolean().default(false),
    hide_from_near_by_users: z.boolean().default(false),
  }).strict(),
};

export const Controller = async (req: Request, res: Response, next: NextFunction, db: DatabaseClient) => {
  const settings = req.body as z.infer<typeof ValidationSchema.body>;
  const user_id = req.user.id;

  const user = await db.queryOne(`
    UPDATE users
    SET settings = $1
    WHERE id = $2
    RETURNING settings
  `, [settings, user_id]);
  
  res.status(200).json(user.settings);
};