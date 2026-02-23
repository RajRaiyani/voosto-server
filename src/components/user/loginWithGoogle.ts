import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import env from '@/config/env.js';
import JwtToken from '@/utils/jwtToken.js';

const client = new OAuth2Client();


export const ValidationSchema = {
  body: z.object({
    token: z.string().trim().nonempty().max(5000),
  })
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { token } = req.body as z.infer<typeof ValidationSchema.body>;

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: [
      env.google.androidClientId,
      env.google.webClientId,
      env.google.iosClientId,
    ],
  });

  const payload = ticket.getPayload();
  
  console.log(payload);

  const user = await db.queryOne(`
    INSERT INTO users (first_name, last_name, email, password_hash, is_email_verified, login_method)
    VALUES ($1, $2, $3, $4, true, 'google_auth')
    RETURNING *
  `, [payload.given_name, payload.family_name, payload.email]);

  const tokenExpiresAt = new Date(Date.now() + 24 * 3600000);

  const authTokenPayload = {
    type: 'user_auth_token',
    user_id: user.id,
  };

  const authToken = JwtToken.encode(authTokenPayload, { expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms` });

  return res.status(200).json({
    token: authToken,
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