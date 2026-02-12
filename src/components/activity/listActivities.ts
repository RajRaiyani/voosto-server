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
      .max(30, 'Radius must be less than 30 km').optional(),
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
    date: z.string().trim().regex(dateOnlyRegex, 'Date must be YYYY-MM-DD').optional(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { search, location, radius, offset, limit, date } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  const user = await db.queryOne('SELECT id, gender FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMan = user.gender === 'male' ? true : false;
  
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
      }
    ) as string[];
    
  }

  let whereClause = ' TRUE ';

  if (search) whereClause += ' AND LOWER(a.description) LIKE LOWER($search) ';
  if (location) whereClause += ' AND a.id = ANY($activity_ids) ';
  if (date) whereClause += ' AND a.date = $date ';
  if (isMan) whereClause += ' AND a.is_womans_only = FALSE ';

  const sqlQuery = `
    SELECT
      a.id,
      a.description,
      a.category,
      a.latitude,
      a.longitude,
      a.date,
      a.time,
      a.is_private,
      a.is_womans_only,
      a.created_at,

      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by

    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE ${whereClause}
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

  const formatDateOnly = (d: Date | string | null) => {
    if (d == null) return d;
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
  };

  const payload = activities.map((a: { date?: Date | string }) => ({
    ...a,
    date: formatDateOnly(a.date ?? null),
  }));

  return res.status(200).json(payload);
}