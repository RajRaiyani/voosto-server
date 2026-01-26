import jwt, { SignOptions } from 'jsonwebtoken';
import env from '@/config/env.js';
import z from 'zod';

const jwtSecretSchema = z.string().min(7).max(1024);

const { data: jwtSecret, error, success } = jwtSecretSchema.safeParse(env.jwtSecret);

if (!success) throw new Error(`Invalid ENV options JWT Secret: ${error.message}`);

function decode(token: string): any {
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    payload = null;
  }
  return payload;
}

function encode(payload: any, options: SignOptions): string {
  return jwt.sign(payload, jwtSecret, options as SignOptions);
}

export default {
  encode,
  decode,
};
