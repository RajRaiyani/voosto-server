import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { getConversationById } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};


export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user!.id;

  const conversation = await getConversationById(db, conversation_id, userId);

  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const [memberCountResponse, activity, trip, pendingRequest] = await Promise.all([
    db.queryOne(`
      SELECT COUNT(*)::integer as member_count FROM conversation_members WHERE conversation_id = $1
    `, [conversation_id]),

    db.queryOne(`
      SELECT 
        a.id, a.description, a.category, a.latitude, a.longitude, a.date, a.time,
        json_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'email', u.email,
          'profile_image_url', f.url
        ) as created_by
      FROM activities a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE a.conversation_id = $1
    `, [conversation_id]),

    db.queryOne(`
      SELECT
        t.id,
        t.place,
        t.date,
        t.created_at,
        t.updated_at,
        json_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'email', u.email,
          'profile_image_url', f.url
        ) as created_by
      FROM trips t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE t.conversation_id = $1
    `, [conversation_id]),

    db.queryOne(`
      SELECT conversation_id, created_at FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2
    `, [conversation_id, userId]),

  ]);
  
  const responseData: any = {
    ...conversation,
    member_count: memberCountResponse.member_count,
    pending_joining_request: pendingRequest,
    activity: activity,
    trip: trip,
  };

  return res.status(200).json(responseData);
}
