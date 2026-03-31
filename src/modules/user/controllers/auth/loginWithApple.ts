import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { verifyAppleToken } from '@/modules/user/etc/appleAuth.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';

export const ValidationSchema = {
  body: z.object({
    token: z.string().trim().nonempty().max(5000),
    first_name: z.string().trim().max(200).nullish(),
    last_name: z.string().trim().max(200).nullish(),
  })
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { token, first_name, last_name } = req.body as z.infer<typeof ValidationSchema.body>;

  const payload = await verifyAppleToken(token);

  let user = await db.queryOne(`
    SELECT id, first_name, last_name, email, is_email_verified, created_at, is_profile_completed
    FROM users
    WHERE email = $1
  `, [payload.email]);

  if (user && !user.is_profile_completed && (first_name || last_name)) {
    user = await db.queryOne(`
      UPDATE users
      SET first_name = $1, last_name = $2
      WHERE id = $3
      RETURNING *
    `, [first_name, last_name, user.id]);
  }

  if (!user) {
    user = await db.queryOne(`
      INSERT INTO users (email, is_email_verified, login_method, first_name, last_name)
      VALUES ($1, true, 'apple_auth', $2, $3)
      RETURNING *
    `, [payload.email, first_name, last_name]);
  }

  const tokenExpiresAt = new Date(Date.now() + 24 * 3600000);

  const authTokenPayload = {
    type: 'user_auth_token',
    user_id: user.id,
  };

  const authToken = JwtToken.encode(authTokenPayload, { expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms` });
  const refreshToken = JwtToken.encode({
    type: 'user_refresh_token',
    user_id: user.id,
  }, { expiresIn: '10d' });

  return res.status(200).json({
    token: authToken,
    refresh_token: refreshToken,
    expires_at: tokenExpiresAt.toISOString(),
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      created_at: user.created_at,
      is_profile_completed: user.is_profile_completed,
    },
  });
}