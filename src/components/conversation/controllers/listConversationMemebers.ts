import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { ensureMember } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) { 
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user!.id;

  await ensureMember(db, conversation_id, userId);

  const members = await db.queryAll(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        f.url as profile_image_url,
        cm.joined_at,
        cm.is_admin
      FROM conversation_members cm
      LEFT JOIN users u ON u.id = cm.user_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE cm.conversation_id = $1
    `, [conversation_id]);

  return res.status(200).json(members);
}