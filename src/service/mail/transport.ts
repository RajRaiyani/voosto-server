import nodemailer from 'nodemailer';
import z from 'zod';
import env from '@/config/env.js';

const transportSchema = z.object({
  host: z.string().min(3).max(255),
  port: z.number().int().positive().max(65535),
  user: z.string().min(3).max(255),
  password: z.string().min(2).max(255),
});

const { data: transportOptions, success } = transportSchema.safeParse({
  host: env.smtp.host,
  port: Number(env.smtp.port),
  user: env.smtp.user,
  password: env.smtp.password,
});

if (!success) throw new Error('Invalid ENV options in Mail service');


const transport = nodemailer.createTransport({
  host: transportOptions.host,
  port: transportOptions.port,
  secure: true,
  auth: {
    user: transportOptions.user,
    pass: transportOptions.password,
  },
});

export default transport;
