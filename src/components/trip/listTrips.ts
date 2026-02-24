import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    trending: z.boolean().optional().default(false),
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

  const {  trending, offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  let whereClause = ' t.created_by = $user_id ';
  let orderBy = ' t.created_at DESC ';

  if (trending){
    whereClause += ' TRUE ';
    orderBy += ' cwm.member_count DESC ';
  }

  const sqlQuery = `
    WITH conversations_with_members AS (
      SELECT
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.created_at,
        COUNT(cm.user_id) as member_count
      FROM conversations c
      LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
      GROUP BY c.id
    )

    SELECT
      t.id,
      t.conversation_id,
      t.place,
      t.date,
      t.created_at,
      t.updated_at,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by
    FROM trips t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN conversations_with_members cwm ON cwm.id = t.conversation_id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    OFFSET $offset LIMIT $limit
  `;

  const trips = await db.namedQueryAll(sqlQuery, { offset, limit, user_id: req.user.id });

  return res.status(200).json(trips);
}
