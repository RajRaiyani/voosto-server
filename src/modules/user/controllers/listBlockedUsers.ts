import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
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
  const { offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;
  const currentUserId = req.user.id;

  const sqlQuery = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.full_name,
      u.email,
      u.gender,
      u.bio,
      f.url AS profile_image_url,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'code', c.code,
        'dial_code', c.dial_code,
        'flag', c.flag
      ) AS country,
      ub.created_at AS blocked_at
    FROM blocked_users ub
    JOIN users u ON u.id = ub.blocked_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE ub.blocker_id = $current_user_id
    ORDER BY ub.created_at DESC
    LIMIT $limit OFFSET $offset
  `;

  const users = await db.namedQueryAll(sqlQuery, {
    current_user_id: currentUserId,
    limit,
    offset,
  });

  return res.status(200).json(users);
}

