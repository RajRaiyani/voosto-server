import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { unFriendUser } from '@/modules/user/user.service.js';

export const ValidationSchema = {
  params: z.object({
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const currentUserId = req.user.id;

  await unFriendUser({ database: db }, { sender_id: currentUserId, receiver_id: user_id });

  return res.status(204).send();
}