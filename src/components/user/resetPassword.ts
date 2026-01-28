import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const ValidationSchema = {
  body: z.object({
    token: z.string().nonempty(),
    new_password: z.string().min(5).max(100),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { token, new_password } =
    req.body as z.infer<typeof ValidationSchema.body>;

  let payload: any;
  try {
    payload = JwtToken.decode(token);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (payload.type !== 'password_reset') {
    return res.status(400).json({ message: 'Invalid token type' });
  }

  const record = await db.queryOne(
    `
    SELECT expires_at, meta_data
    FROM tokens
    WHERE token = $1
    `,
    [token]
  );

  if (!record) {
    return res.status(400).json({ message: 'Invalid token' });
  }

  if (record.meta_data.type !== 'password_reset') {
    return res.status(400).json({ message: 'Invalid token' });
  }

  const passwordHash = await bcrypt.hash(new_password, 10);

  try {
    await db.query('BEGIN');

    await db.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      `,
      [passwordHash, record.meta_data.user_id]
    );

    await db.query(
      `
      DELETE FROM tokens
      WHERE token = $1
      `,
      [token]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  return res.status(200).json({
    message: 'Password reset successful',
  });
}
