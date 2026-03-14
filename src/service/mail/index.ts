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


export async function SendMail({ to, subject, html }: {to: string, subject: string, html: string}) {
  const transport = nodemailer.createTransport({
    host: transportOptions.host,
    port: transportOptions.port,
    secure: true,
    auth: {
      user: transportOptions.user,
      pass: transportOptions.password,
    },
  });
  const result = await transport.sendMail({ from: env.smtp.user, to, subject, html });
  return result;
}
