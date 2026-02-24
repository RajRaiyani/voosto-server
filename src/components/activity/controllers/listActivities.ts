import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import RedisClient from '@/service/redis/index.js';
import Schema from '@/config/validationSchema.js';


const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ValidationSchema = {
  query: z.object({
    search: z.string().trim().max(200, 'Search must be less than 100 characters').optional(),
    location: Schema.location().optional(),
    // in kilometers
    radius: z.coerce.number()
      .min(1, 'Radius must be greater than 1 km')
      .max(5000, 'Radius must be less than 5000 km').optional(),
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
    date: z.string().trim().regex(dateOnlyRegex, 'Date must be YYYY-MM-DD').optional(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { search, location, radius, offset, limit, date } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  const user = await db.queryOne('SELECT id, gender FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const notWoman = user.gender === 'male' || user.gender === 'other' ? true : false;
  
  let activity_ids: string[] = [];
  if (location) {

    activity_ids = await RedisClient.geoSearch(
      'geo:activity', 
      {
        longitude: location.longitude,
        latitude: location.latitude,
      }, 
      {
        radius: radius ?? 10,
        unit: 'km',
      },
      {
        SORT: 'ASC', // Sort by distance
      }
    ) as string[];
    
  }

  let whereClause = ' TRUE ';

  if (search) whereClause += ' AND LOWER(a.description) LIKE LOWER($search) ';
  if (location) whereClause += ' AND a.id = ANY($activity_ids) ';
  if (date) whereClause += ' AND a.date = $date ';
  if (notWoman) whereClause += ' AND c.is_womans_only = FALSE ';

  const sqlQuery = `
    SELECT
      a.id,
      a.description,
      a.category,
      a.latitude,
      a.longitude,
      a.date,
      a.time,
      a.created_at,

      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by,

      json_build_object(
        'id', c.id,
        'name', c.name,
        'is_group', c.is_group,
        'is_private', c.is_private,
        'is_womans_only', c.is_womans_only,
        'member_count', COUNT(cm.user_id)
      ) as conversation

    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN conversations c ON c.id = a.conversation_id
    LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE ${whereClause}
    GROUP BY a.id, c.id, u.id, f.id
    ORDER BY a.created_at DESC
    LIMIT $limit OFFSET $offset
  `;

  const activities = await db.namedQueryAll(sqlQuery, {
    search: search ? `%${search}%` : null,
    activity_ids,
    date: date ?? null,
    limit,
    offset,
  });

  return res.status(200).json(activities);
}