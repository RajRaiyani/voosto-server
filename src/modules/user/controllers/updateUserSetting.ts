import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  body: z.object({
    notify_near_by_activities: z.boolean().optional(),
    hide_my_distance: z.boolean().optional(),
    hide_from_near_by_users: z.boolean().optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update',
    }
  ),
};

export const Controller = async (req: Request, res: Response, next: NextFunction, db: DatabaseClient) => {
  const settings = req.body as z.infer<typeof ValidationSchema.body>;
  const user_id = req.user.id;

  const existingUser = await db.queryOne(`
    SELECT settings
    FROM users
    WHERE id = $1
  `, [user_id]);


  if (!existingUser) return res.status(404).json({ message: 'User not found' });


  const user = await db.queryOne(`
    UPDATE users
    SET settings = $1
    WHERE id = $2
    RETURNING settings
  `, [{ ...existingUser.settings, ...settings }, user_id]);
  
  res.status(200).json(user.settings);
};