import Transport from './transport.js';
import env from '@/config/env.js';

export async function SendMail({ to, subject, html }: {to: string, subject: string, html: string}) {
  const result = await Transport.sendMail({ from: env.smtp.user, to, subject, html });
  return result;
}
