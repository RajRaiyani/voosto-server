import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  const notifications = await db.queryAll(
    `
    WITH new_activity_notifications AS (
      SELECT 
        n.*,
        ac.icon as display_emoji,
        NULL::text as display_picture_url
      FROM notifications n
      LEFT JOIN activities a ON a.id::text = n.meta_data->>'activity_id'
      LEFT JOIN activity_categories ac ON ac.id = a.category_id
      WHERE n.type = 'new_activity'
      AND n.user_id = $1
    ),

    friend_request_accepted_notifications AS (
      SELECT 
        n.*,
        NULL::text as display_emoji,
        f.url as display_picture_url
      FROM notifications n
      LEFT JOIN users u ON u.id::text = n.meta_data->>'receiver_id'
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE n.type = 'friend_request_accepted'
      AND n.user_id = $1
    ),

    friend_request_accepted_notifications_self AS (
      SELECT 
        n.*,
        NULL::text as display_emoji,
        f.url as display_picture_url
      FROM notifications n
      LEFT JOIN users u ON u.id::text = n.meta_data->>'sender_id'
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE n.type = 'friend_request_accepted_self'
      AND n.user_id = $1
    ),
    
    new_friend_request_notifications AS (
      SELECT 
        n.*,
        NULL::text as display_emoji,
        f.url as display_picture_url
      FROM notifications n
      LEFT JOIN users u ON u.id::text = n.meta_data->>'sender_id'
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE n.type = 'new_friend_request'
      AND n.user_id = $1
    ),

    new_conversation_joining_request_notifications AS (
      SELECT 
        n.*,
        c.display_emoji,
        f.url as display_picture_url
      FROM notifications n
      LEFT JOIN conversations c ON c.id::text = n.meta_data->>'conversation_id'
      LEFT JOIN files f ON f.id = c.display_picture_id
      WHERE n.type = 'new_conversation_joining_request'
      AND n.user_id = $1
    ),

    conversation_joining_request_accepted_notifications AS (
      SELECT 
        n.*,
        c.display_emoji,
        f.url as display_picture_url
      FROM notifications n
      LEFT JOIN conversations c ON c.id::text = n.meta_data->>'conversation_id'
      LEFT JOIN files f ON f.id = c.display_picture_id
      WHERE n.type = 'conversation_joining_request_accepted'
      AND n.user_id = $1
    ),

    conversation_joining_request_rejected_notifications AS (
      SELECT 
        n.*,
        f.url as display_picture_url,
        c.display_emoji
      FROM notifications n
      LEFT JOIN conversations c ON c.id::text = n.meta_data->>'conversation_id'
      LEFT JOIN files f ON f.id = c.display_picture_id
      WHERE n.type = 'conversation_joining_request_rejected'
      AND n.user_id = $1
    ),

    all_notifications AS (
      SELECT * FROM new_activity_notifications
      UNION ALL
      SELECT * FROM new_friend_request_notifications
      UNION ALL
      SELECT * FROM new_conversation_joining_request_notifications
      UNION ALL
      SELECT * FROM conversation_joining_request_accepted_notifications
      UNION ALL
      SELECT * FROM conversation_joining_request_rejected_notifications
      UNION ALL
      SELECT * FROM friend_request_accepted_notifications
      UNION ALL
      SELECT * FROM friend_request_accepted_notifications_self
    )

    SELECT * FROM all_notifications
    ORDER BY created_at DESC
    OFFSET $2 LIMIT $3
  `,
    [req.user.id, offset, limit],
  );

  return res.status(200).json(notifications);
}