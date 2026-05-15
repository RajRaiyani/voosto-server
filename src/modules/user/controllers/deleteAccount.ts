import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import z from 'zod';
import dataEmailTemplate from '@/utils/emailTemplates/data.js';
import env from '@/config/env.js';
import { SendMail } from '@/service/mail/index.js';

export const ValidationSchema = {
  body: z.object({
    reason: z.string().trim().max(3000, 'Account delete reason must be less than 500 characters').default(''),
  })
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const userId = req.user.id;
  const { reason } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne<{
    id: string;
    email: string;
    is_deleted: boolean;
  }>('SELECT id, email, is_deleted FROM users WHERE id = $1', [userId]);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.is_deleted) {
    return res.status(204).send();
  }

  try{

    await db.begin();

    await db.query('DELETE FROM friend_mappings WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await db.query('DELETE FROM conversation_joining_requests WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM conversation_members WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM activities WHERE created_by = $1', [userId]);
    await db.query('DELETE FROM user_notification_tokens WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM user_posts WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM user_interested_activities WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM visited_countries WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM report_inquiries WHERE created_by = $1', [userId]);
    await db.query('DELETE FROM trips WHERE created_by = $1', [userId]);
    await db.query('DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1', [userId]);
    await db.query('DELETE FROM message_reactions WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM message_reads WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM message_reads WHERE message_id in (select id from messages where sender_id = $1)', [userId]);
    await db.query('DELETE FROM message_attachments where message_id in (select id from messages where sender_id = $1)', [userId]);
    await db.query('DELETE FROM messages WHERE sender_id = $1', [userId]);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    await db.commit();
  }catch(error){
    await db.rollback();
    throw error;
  }

  const html = dataEmailTemplate({
    reason: reason,
    email: user.email,
    is_deleted: true,
  });

  await SendMail({
    to: env.informerEmail,
    subject: 'Account Deleted',
    html: html,
  });

  return res.status(204).send();
}

