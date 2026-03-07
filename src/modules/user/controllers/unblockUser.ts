import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';

export const ValidationSchema = {
  params: z.object({
    user_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const blocker_id = req.user.id;

  await db.query(
    `
    DELETE FROM blocked_users
    WHERE blocker_id = $1 AND blocked_id = $2
  `,
    [blocker_id, user_id]
  );

  return res.status(204).send();
}

