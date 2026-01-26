import { z } from 'zod';
import UserSchema from './user.validation.js';
import { DatabaseClient } from '@/service/database/index.js';
import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';
import { SendMail } from '@/service/mail/index.js';
import  emailVerifyOtp  from '@/utils/emailTemplates/emailVerifyOtp.js';

export const ValidationSchema = {
  body: z.object({
    first_name: UserSchema.firstName(),
    last_name: UserSchema.lastName(),
    email: z.email().toLowerCase(),
    password: z.string().trim().min(5).max(100),
  })
};

function generateOtp(){
  return Math.floor(100000 + Math.random() * 900000);
}

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { first_name, last_name, email, password } = req.body as z.infer<typeof ValidationSchema.body>;

  const existingUser = await db.queryOne(`
    SELECT id FROM users WHERE LOWER(email) = LOWER($1)
  `, [email]);

  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const tokenPayload = {
    type: 'user_registration_token',
    first_name,
    last_name,
    email,
    password,
  };

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const token = JwtToken.encode(tokenPayload, { expiresIn: `${expiresAt.getTime() - Date.now()}ms` });
  const otp = generateOtp().toString();

  await db.query(`
    INSERT INTO tokens (token, expires_at, meta_data)
    VALUES ($1, $2, $3)
  `, [token, expiresAt.toISOString(), { otp }]);

  const mailHtml = emailVerifyOtp(otp);

  SendMail({ to: email, subject: 'Registration verification code', html: mailHtml });

  return res.status(200).json({ 
    token,
    expires_at: expiresAt.toISOString(),
  });
}

