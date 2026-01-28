import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import JwtToken from '@/utils/jwtToken.js';
import { SendMail } from '@/service/mail/index.js';
import emailVerifyOtp from '@/utils/emailTemplates/emailVerifyOtp.js';

export const ValidationSchema = {
  body: z.object({
    email: z.email().toLowerCase(),
  }),
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { email } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne(
    'select id from users where Lower(email) = Lower($1)',
    [email],
  );

  if(!user){
    return res.status(200).json({
      message: 'email not found',
    });
  }

  const otp = generateOtp();

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const payload = {
    type: 'forgot_password_otp',
    user_id: user.id,
  };

  const token = JwtToken.encode(payload, {
    expiresIn: `${expiresAt.getTime() - Date.now()}ms`
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
        type: 'forgot_password_otp',
        user_id: user.id,
        otp,
      },
    ]
  );

  await SendMail({
    to: email,
    subject: 'forgot password otp',
    html: emailVerifyOtp(otp),
  });

  return res.status(200).json({
    token,
    expires_at: expiresAt.toISOString(),
  });
}
