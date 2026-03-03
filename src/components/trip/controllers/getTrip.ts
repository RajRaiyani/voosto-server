import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isMemberOfConversation } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    trip_id: Schema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { trip_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user!.id;

  const sqlQuery = `
    WITH conversations_with_members AS (
      SELECT
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.place_id,
        c.place_name,
        c.meta_data,
        c.created_at,
        COUNT(cm.user_id) as member_count
      FROM conversations c
      LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
      GROUP BY c.id
    ),

    ranked_members AS (
      SELECT
        cm.conversation_id,
        cm.user_id,
        cm.joined_at,
        cm.is_admin,
        ROW_NUMBER() OVER (PARTITION BY cm.conversation_id ORDER BY cm.joined_at) AS rn
      FROM conversation_members cm
      INNER JOIN conversations c ON c.id = cm.conversation_id AND c.place_id IS NOT NULL
    ),

    first_five_members AS (
      SELECT
        rm.conversation_id,
        json_agg(
          json_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email,
            'profile_image_url', f.url,
            'joined_at', rm.joined_at,
            'is_admin', rm.is_admin
          ) ORDER BY rm.joined_at
        ) AS members
      FROM ranked_members rm
      INNER JOIN users u ON u.id = rm.user_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE rm.rn <= 5
      GROUP BY rm.conversation_id
    )

    SELECT
      t.id,
      cwm.id as conversation_id,
      t.place_id,
      t.place_name,
      t.date,
      t.created_at,
      t.updated_at,
      t.meta_data,
      COALESCE(ffm.members, '[]'::json) AS members,
      cwm.member_count::integer as member_count,

      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by,

      CASE WHEN cwm.id IS NOT NULL THEN
        json_build_object(
          'id', cwm.id,
          'name', cwm.name,
          'place_name', cwm.place_name,
          'place_id', cwm.place_id,
          'is_group', cwm.is_group,
          'is_private', cwm.is_private,
          'is_womans_only', cwm.is_womans_only,
          'member_count', cwm.member_count
        )

      ELSE NULL END as conversation
    FROM trips t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN conversations_with_members cwm ON cwm.place_id = t.place_id
    LEFT JOIN first_five_members ffm ON ffm.conversation_id = cwm.id
    WHERE t.id = $trip_id AND t.created_by = $user_id
  `;

  
  const trip = await db.namedQueryOne(sqlQuery, { trip_id, user_id: userId });
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const isMember = await isMemberOfConversation(db, trip.conversation_id, userId);
  trip.is_member = isMember;


  return res.status(200).json(trip);
}
