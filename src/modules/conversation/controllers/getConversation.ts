import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { getConversationById } from '@/modules/conversation/conversation.service.js';

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

  const [memberCountResponse, members, activity, trip, pendingRequest] = await Promise.all([
    db.queryOne(`
      SELECT COUNT(*)::integer as member_count FROM conversation_members WHERE conversation_id = $1
    `, [conversation_id]),

    db.queryAll(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.gender,
        f.url as profile_image_url,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'code', c.code,
          'dial_code', c.dial_code,
          'flag', c.flag
        ) as country,
        CASE WHEN fm.status IS NOT NULL THEN true ELSE false END AS is_friend
      FROM conversation_members cm
      INNER JOIN users u ON u.id = cm.user_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      LEFT JOIN countries c ON c.id = u.country_id
      LEFT JOIN friend_mappings fm ON 
        fm.status = 'accepted' AND (
          (fm.sender_id = $2 AND fm.receiver_id = u.id) OR
          (fm.receiver_id = $2 AND fm.sender_id = u.id)
        )
      WHERE cm.conversation_id = $1
      ORDER BY is_friend DESC, u.created_at DESC
      LIMIT 10
    `, [conversation_id, userId]),

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
        t.place_name,
        t.place_id,
        t.date,
        t.created_at,
        t.updated_at,
        t.meta_data,
        json_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'email', u.email,
          'profile_image_url', f.url
        ) as created_by
      FROM trips t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE t.conversation_id = $1 and t.created_by = $2
    `, [conversation_id, userId]),

    db.queryOne(`
      SELECT conversation_id, created_at FROM conversation_joining_requests WHERE conversation_id = $1 AND user_id = $2
    `, [conversation_id, userId]),

  ]);
  
  const responseData: any = {
    ...conversation,
    member_count: memberCountResponse.member_count,
    members,
    pending_joining_request: pendingRequest,
    activity: activity,
    trip: trip,
  };

  return res.status(200).json(responseData);
}
