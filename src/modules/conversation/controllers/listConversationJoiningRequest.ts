import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Schema from '@/config/validationSchema.js';
import { z } from 'zod';
import { isAdminOfConversation } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user.id;

  const isAdmin = await isAdminOfConversation(db, conversation_id, userId);
  if (!isAdmin) return res.status(403).json({ message: 'You are not an admin of this group' });

  const joiningRequests = await db.queryAll(`
    SELECT 
      cjr.conversation_id,
      cjr.created_at,
      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as user
  
    FROM conversation_joining_requests cjr
    LEFT JOIN users u ON u.id = cjr.user_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE cjr.conversation_id = $1
  `, [conversation_id]);

  return res.status(200).json(joiningRequests);
}