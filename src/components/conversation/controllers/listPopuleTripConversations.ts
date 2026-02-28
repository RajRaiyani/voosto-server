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

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { offset, limit } = req.validatedQuery as z.infer<
    typeof ValidationSchema.query
  >;

  const sqlQuery = `
    WITH
    conversations_with_member_count AS (
      SELECT
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.place_id,
        c.place_name,
        c.display_picture_id,
        c.created_at,
        c.meta_data,
        COUNT(cm.user_id)::integer AS member_count
      FROM conversations c
      LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
      WHERE c.place_id IS NOT NULL
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
      cwm.id,
      cwm.name,
      cwm.is_group,
      cwm.is_private,
      cwm.is_womans_only,
      cwm.place_id,
      cwm.place_name,
      cwm.meta_data,
      cwm.member_count,
      cwm.created_at,
      CASE WHEN f.id IS NOT NULL THEN
        json_build_object('id', f.id, 'url', f.url)
      ELSE NULL END AS display_picture,
      COALESCE(ffm.members, '[]'::json) AS members
    FROM conversations_with_member_count cwm
    LEFT JOIN first_five_members ffm ON ffm.conversation_id = cwm.id
    LEFT JOIN files f ON f.id = cwm.display_picture_id
    ORDER BY cwm.member_count DESC, cwm.created_at DESC
    OFFSET $1 LIMIT $2
  `;

  const conversations = await db.queryAll(sqlQuery, [
    offset,
    limit,
  ]);

  return res.status(200).json(conversations);
}
