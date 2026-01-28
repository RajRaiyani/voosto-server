import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';

export const ValidationSchema = {
  body: z.object({
    token: z.string().trim().nonempty(),
    otp: z.string().trim().length(6),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { token, otp } = req.body as z.infer<typeof ValidationSchema.body>;

  //   const tokenData = JwtToken.decode(token) as { type: 'forgot_password_otp', user_id: string };

  let tokenData: { type: string; user_id: string };

  try {
    tokenData = JwtToken.decode(token) as { type: string; user_id: string };
  } catch {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (tokenData.type !== 'forgot_password_otp') {
    return res.status(400).json({ message: 'Invalid token' });
  }

  const dbToken = await db.queryOne(
    `
    SELECT meta_data
    FROM tokens
    WHERE token = $1 AND expires_at > NOW()
    `,
    [token]
  );

  if (!dbToken) {
    return res.status(400).json({ message: 'Token has been used or expired' });
  }

  if (dbToken.meta_data.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const resetPayload = {
    type: 'password_reset',
    user_id: dbToken.meta_data.user_id,
  };

  const resetToken = JwtToken.encode(resetPayload, {
    expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms`,
  });

  try {
    await db.query('BEGIN');

    await db.query('DELETE FROM tokens WHERE token = $1', [token]);

    await db.query(
      `
      INSERT INTO tokens (token, expires_at, meta_data)
      VALUES ($1, $2, $3)
      `,
      [
        resetToken,
        tokenExpiresAt,
        {
          type: 'password_reset',
          user_id: dbToken.meta_data.user_id,
        },
      ]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  return res.status(200).json({
    token: resetToken,
    expires_at: tokenExpiresAt.toISOString(),
  });
}
