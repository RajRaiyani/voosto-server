import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    search: z
      .string()
      .trim()
      .max(200, 'Search must be less than 100 characters')
      .optional(),
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
  const { search, offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  let whereClause = ' TRUE ';

  if (search) whereClause += ' AND LOWER(t.place) LIKE LOWER($search) ';

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
    WHERE ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $limit OFFSET $offset
  `;

  const trips = await db.namedQueryAll(sqlQuery, {
    search: search ? `%${search}%` : null,
    limit,
    offset,
  });

  return res.status(200).json(trips);
}
