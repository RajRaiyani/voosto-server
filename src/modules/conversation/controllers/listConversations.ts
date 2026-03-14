import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import Constants from '@/config/constant.js';

const activityCategoriesIcons = Constants.activities.categories.reduce((acc, category) => {
  acc[category.activity] = category.icon;
  return acc;
}, {});

export const ValidationSchema = {
  query: z.object({
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;
  const userId = req.user!.id;

  const conversations = await db.queryAll(
    `
    WITH last_msg AS (
      SELECT DISTINCT ON (conversation_id)
        id,
        conversation_id,
        content,
        created_at,
        sender_id,
        seen_at
      FROM messages
      ORDER BY conversation_id, created_at DESC
    ),

    blocked_users AS (
      SELECT blocker_id AS other_user_id
      FROM blocked_users
      WHERE blocked_id = $1
    ),

    blocked_conversations AS (
      SELECT DISTINCT cm.conversation_id
      FROM conversation_members cm
      LEFT JOIN conversations c ON c.id = cm.conversation_id
      JOIN blocked_users bu ON bu.other_user_id = cm.user_id
      WHERE c.is_group = false
    ),

    conversations_for_user_without_message AS (
      SELECT 
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.display_picture_id,
        c.display_emoji,
        c.created_at
      FROM conversation_members cm
      INNER JOIN conversations c ON c.id = cm.conversation_id
      LEFT JOIN blocked_conversations bc ON bc.conversation_id = c.id
      WHERE cm.user_id = $1
        AND bc.conversation_id IS NULL
    ),

    conversations_for_user AS (
      SELECT 
        cfuwm.id,
        cfuwm.name,
        cfuwm.is_group,
        cfuwm.is_private,
        cfuwm.is_womans_only,
        cfuwm.display_picture_id,
        cfuwm.display_emoji,
        cfuwm.created_at,
        CASE WHEN lm.id IS NOT NULL THEN
          json_build_object(
            'id', lm.id,
            'content', lm.content,
            'created_at', lm.created_at,
            'sender_id', lm.sender_id,
            'seen_at', lm.seen_at
          )
        ELSE NULL END AS last_message
      FROM conversations_for_user_without_message cfuwm
      LEFT JOIN last_msg lm ON lm.conversation_id = cfuwm.id
    ),


    group_conversations AS (
      SELECT 
        cfu.id,
        cfu.name,
        cfu.is_group,
        cfu.is_private,
        cfu.is_womans_only,
        cfu.created_at,
        cfu.last_message,
        cfu.display_emoji,
        CASE WHEN f.id IS NOT NULL THEN
          json_build_object(
            'id', f.id,
            'url', f.url
          )
        ELSE NULL END AS display_picture
      FROM conversations_for_user cfu
      LEFT JOIN files f ON f.id = cfu.display_picture_id
      LEFT JOIN last_msg lm ON lm.conversation_id = cfu.id
      WHERE cfu.is_group = true
    ),

    private_conversations AS (
      SELECT 
        cfu.id,
        u.full_name,
        cfu.is_group,
        cfu.is_private,
        cfu.is_womans_only,
        cfu.created_at,
        cfu.last_message,
        cfu.display_emoji,
        CASE WHEN f.id IS NOT NULL THEN
          json_build_object(
            'id', f.id,
            'url', f.url
          )
        ELSE NULL END AS display_picture
      FROM conversations_for_user cfu
      LEFT JOIN conversation_members cm ON cm.conversation_id = cfu.id AND cm.user_id != $1
      LEFT JOIN users u ON u.id = cm.user_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE cfu.is_group = false
    ),

    all_conversations AS (
      SELECT * FROM group_conversations
      UNION ALL
      SELECT * FROM private_conversations
    )

    SELECT
      c.id,
      c.name,
      c.is_group,
      c.is_private,
      c.is_womans_only,
      c.last_message,
      c.display_picture,
      c.created_at,
      c.display_emoji,

      json_build_object(
        'id', a.id,
        'description', a.description,
        'category', ac.name,
        'latitude', a.latitude,
        'longitude', a.longitude,
        'date', a.date,
        'time', a.time
      ) as activity

    FROM all_conversations c
    LEFT JOIN activities a ON a.conversation_id = c.id
    LEFT JOIN activity_categories ac ON ac.id = a.category_id
    ORDER BY COALESCE((c.last_message->>'created_at')::timestamptz, c.created_at) DESC
    OFFSET $2 LIMIT $3
    `,
    [userId, offset, limit]
  );

  conversations.forEach(conversation => {
    if (conversation.activity) {
      conversation.activity.category_icon = activityCategoriesIcons[conversation.activity.category];
    }
  });

  return res.status(200).json(conversations);
}
