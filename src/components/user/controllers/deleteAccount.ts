import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const userId = req.user.id;

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

  const updatedEmail = `deleted.${user.email}`;

  await db.query(
    `
      UPDATE users
      SET email = $1,
          is_deleted = true
      WHERE id = $2
    `,
    [updatedEmail, userId]
  );

  return res.status(204).send();
}
