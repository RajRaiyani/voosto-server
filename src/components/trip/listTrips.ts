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

  const sqlQuery = `
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
    WHERE t.created_by = $1
    ORDER BY t.created_at DESC
  `;

  const trips = await db.queryAll(sqlQuery, [req.user.id]);

  return res.status(200).json(trips);
}
