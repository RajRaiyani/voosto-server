import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  params: z.object({
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const currentUserId = req.user.id;

  await db.query(`
    DELETE FROM friend_mappings 
    WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
  `, [currentUserId, user_id]);

  return res.status(204).send();
}