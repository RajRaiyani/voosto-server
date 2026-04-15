import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const ValidationSchema = {
  body: z.object({
    token: z.string().trim().nonempty(),
    otp: z.string().trim().length(6),
  })
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { token, otp } = req.body as z.infer<typeof ValidationSchema.body>;
  const tokenData = JwtToken.decode(token) as { type: 'user_registration_token', first_name: string, last_name: string, email: string, password: string };

  if (!tokenData || tokenData.type !== 'user_registration_token') return res.status(400).json({ message: 'Invalid token' });

  const dbToken = await db.queryOne(`
    SELECT meta_data FROM tokens WHERE token = $1 AND expires_at > NOW()
  `, [token]);

  if (!dbToken) return res.status(400).json({ message: 'Token has been used or expired' });

  if (dbToken.meta_data.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  const passwordHash = await bcrypt.hash(tokenData.password, 7);

  const user = await db.queryOne(`
    INSERT INTO users (first_name, last_name, email, password_hash, is_email_verified)
    VALUES ($1, $2, $3, $4, true)
    RETURNING *
  `, [tokenData.first_name, tokenData.last_name, tokenData.email, passwordHash]);

  const tokenExpiresAt = new Date(Date.now() + 24 * 3600000 * 14);

  const authTokenPayload = {
    type: 'user_auth_token',
    user_id: user.id,
  };
  const authToken = JwtToken.encode(authTokenPayload, { expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms` });
  const refreshToken = JwtToken.encode({
    type: 'user_refresh_token',
    user_id: user.id,
  }, { expiresIn: '20d' });

  await db.query('DELETE FROM tokens WHERE token = $1', [token]);

  return res.status(200).json({ 
    token: authToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      created_at: user.created_at,
      is_profile_completed: user.is_profile_completed,
    },
    expires_at: tokenExpiresAt.toISOString(),
  });
}