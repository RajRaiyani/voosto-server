import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import z from 'zod';

export const ValidationSchema = {
  body: z.object({
    reason: z.string().trim().max(3000, 'Account delete reason must be less than 500 characters').default(''),
  })
};


function generateRandomNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const userId = req.user.id;
  const { reason } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne<{
    id: string;
    email: string;
    is_deleted: boolean;
  }>('SELECT id, email, is_deleted FROM users WHERE id = $1', [userId]);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.is_deleted) {
    return res.status(204).send();
  }

  const updatedEmail = `deleted.${user.email}.${generateRandomNumber()}`;

  await db.query(
    `
      UPDATE users
      SET email = $1,
          account_delete_reason = $3,
          is_deleted = true
      WHERE id = $2
    `,
    [updatedEmail, userId, reason]
  );

  return res.status(204).send();
}

