import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const ValidationSchema = {
  body: z.object({
    email: z.email().toLowerCase(),
    password: z.string().trim().nonempty().max(100),
  })
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { email, password } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne(`
    SELECT 
      id, password_hash, first_name, last_name, 
      email, is_profile_completed, created_at,
      login_method
    FROM users 
    WHERE LOWER(email) = LOWER($1) AND is_deleted = false
  `, [email]);

  if (!user) return res.status(400).json({ message: 'Invalid email or password' });

  if (!user.password_hash) {
    if (user.login_method === 'google_auth') {
      return res.status(400).json({ message: 'use login with google option to login to your account' });
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

  const tokenExpiresAt = new Date(Date.now() + 24 * 3600000 * 14);
  // const tokenExpiresAt = new Date(Date.now() + 10 * 1000);

  const authTokenPayload = {
    type: 'user_auth_token',
    user_id: user.id,
  };
  
  const authToken = JwtToken.encode(authTokenPayload, { expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms` });
  const refreshToken = JwtToken.encode({
    type: 'user_refresh_token',
    user_id: user.id,
  }, { expiresIn: '20d' });

  return res.status(200).json({ 
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      created_at: user.created_at,
      is_profile_completed: user.is_profile_completed,
    },
    token: authToken,
    refresh_token: refreshToken,
    expires_at: tokenExpiresAt.toISOString(),
  });
}