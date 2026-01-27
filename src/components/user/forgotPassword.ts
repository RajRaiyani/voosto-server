import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import JwtToken from '@/utils/jwtToken.js';
import { SendMail } from '@/service/mail/index.js';
import resetPasswordLink from '@/utils/emailTemplates/resetPasswordLink.js';
import { validateRedirectUrl } from '@/utils/security/redirectValidator.js';

export const ValidationSchema = {
  body: z.object({
    email: z.email().toLowerCase(),

    //url validator
    redirect_url: z.string().url(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { email, redirect_url } =
    req.body as z.infer<typeof ValidationSchema.body>;

  if (!validateRedirectUrl(redirect_url)) {
    return res.status(400).json({ message: 'Invalid redirect_url' });
  }

  const user = await db.queryOne(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (!user) {
    return res.status(200).json({
      message: 'email not found',
    });
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const payload = {
    type: 'password_reset',
    user_id: user.id,
  };

  const token = JwtToken.encode(payload, {
    expiresIn: `${expiresAt.getTime() - Date.now()}ms`,
  });

  await db.query(
    `
    INSERT INTO tokens (token, expires_at, meta_data)
    VALUES ($1, $2, $3)
    `,
    [
      token,
      expiresAt,
      {
        type: 'password_reset',
        user_id: user.id,
        redirect_url,
        used_at: null,
      },
    ]
  );

  const magicLink = `${redirect_url}?token=${token}`;

  await SendMail({
    to: email,
    subject: 'Reset your password',
    html: resetPasswordLink(magicLink),
  });

  return res.status(200).json({
    message: 'Reset link has been sent to your email',
  });
}
