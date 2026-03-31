import type { NextFunction, Request, Response } from 'express';
import type { DatabaseClient } from '@/service/database/index.js';
import z from 'zod';
import JwtToken from '@/utils/jwtToken.js';

export const ValidationSchema = {
  body: z.object({
    refresh_token: z.string().trim().min(1).max(5000),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { refresh_token } = req.body as z.infer<typeof ValidationSchema.body>;

  const decoded = JwtToken.decode(refresh_token) as { type: 'user_refresh_token', user_id: string };
  if (!decoded || decoded.type !== 'user_refresh_token') return res.status(400).json({ message: 'Invalid refresh token' });

  const user = await db.queryOne(
    'SELECT id, first_name, last_name, email FROM users WHERE id = $1 AND is_deleted = false',
    [decoded.user_id],
  );
  if (!user) return res.status(400).json({ message: 'Invalid refresh token' });

  const accessToken = JwtToken.encode(
    { type: 'user_auth_token', user_id: user.id }, 
    { expiresIn: '1h' }
  );

  const refreshToken = JwtToken.encode(
    { type: 'user_refresh_token', user_id: user.id },
    { expiresIn: '7d' }
  );

  return res.status(200).json({ 
    token: accessToken, 
    refresh_token: refreshToken, 
    user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email } 
  });
}
