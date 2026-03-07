import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import RedisClient from '@/service/redis/index.js';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    search: z
      .string()
      .trim()
      .max(200, 'Search must be less than 200 characters')
      .optional(),
    location: Schema.location().optional(),
    // in kilometers
    radius: z
      .coerce.number()
      .min(1, 'Radius must be greater than 1 km')
      .max(5000, 'Radius must be less than 5000 km')
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
  const { search, location, radius, offset, limit } = req
    .validatedQuery as z.infer<typeof ValidationSchema.query>;

  const currentUserId = req.user.id;

  let userIds: string[] = [];

  if (location) {
    userIds = (await RedisClient.geoSearch(
      'geo:user',
      {
        longitude: location.longitude,
        latitude: location.latitude,
      },
      {
        radius: radius ?? 10,
        unit: 'km',
      },
      {
        SORT: 'ASC', // sort by distance
      }
    )) as string[];

    if (userIds.length === 0) {
      return res.status(200).json([]);
    }
  }

  let whereClause = ` 
    u.id != $current_user_id AND 
    COALESCE(u.settings->>'hide_from_near_by_users', 'false') = 'false' AND
    ub.blocked_id IS NULL
  `;

  if (search) {
    whereClause += ' AND u.full_name ILIKE $search ';
  }

  if (location) {
    whereClause += ' AND u.id = ANY($user_ids) ';
  }

  const orderClause = location
    ? ' ORDER BY array_position($user_ids, u.id::text) ASC '
    : ' ORDER BY u.created_at DESC ';

  const sqlQuery = `
    WITH user_with_interested_activities AS (
      SELECT
        u.*,
        array_agg(
          json_build_object(
            'id', ac.id,
            'name', ac.name,
            'icon', ac.icon
          )
        ) as interested_activities
      FROM users u
      LEFT JOIN user_interested_activities uia ON uia.user_id = u.id
      LEFT JOIN activity_categories ac ON ac.id = uia.activity_category_id
      GROUP BY u.id
    )

    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.full_name,
      u.email,
      u.gender,
      u.bio,
      u.heard_about_us,
      u.interested_activities,
      f.url as profile_image_url,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'code', c.code,
        'dial_code', c.dial_code,
        'flag', c.flag
      ) as country
    FROM user_with_interested_activities u
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    LEFT JOIN blocked_users ub ON ub.blocker_id = $current_user_id AND ub.blocked_id = u.id
    WHERE ${whereClause}
    ${orderClause}
    LIMIT $limit OFFSET $offset
  `;

  const users = await db.namedQueryAll(sqlQuery, {
    current_user_id: currentUserId,
    search: search ? `%${search}%` : null,
    user_ids: userIds,
    limit,
    offset,
  });

  return res.status(200).json(users);
}
