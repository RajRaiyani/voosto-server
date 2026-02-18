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

  const user_id = req.user.id;

  let nearbyFriendIds: string[] = [];

  if (location) {
    nearbyFriendIds = (await RedisClient.geoSearch(
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
        SORT: 'ASC',
      }
    )) as string[];
  }

  let whereClause = `
    (fm.sender_id = $user_id OR fm.receiver_id = $user_id)
    AND fm.status = 'accepted'
  `;

  if (search) {
    whereClause += `
      AND (
        LOWER(u.first_name) LIKE LOWER($search)
        OR LOWER(u.last_name) LIKE LOWER($search)
        OR LOWER(u.full_name) LIKE LOWER($search)
      )
    `;
  }

  if (location) {
    whereClause += `
      AND u.id = ANY($nearby_friend_ids)
    `;
  }

  const sqlQuery = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.full_name,
      u.email,
      u.gender,
      u.bio,
      u.interested_activity,
      f.url as profile_image_url,
      
      CASE WHEN c.id IS NOT NULL THEN
        json_build_object(
          'id', c.id,
          'name', c.name, 
          'code', c.code, 
          'dial_code', c.dial_code
        )
      ELSE NULL END as country,
      
      fm.created_at as friends_since
      
    FROM friend_mappings fm
    INNER JOIN users u ON u.id = CASE 
      WHEN fm.sender_id = $user_id THEN fm.receiver_id
      ELSE fm.sender_id
    END
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE ${whereClause}
    ORDER BY fm.created_at DESC
    LIMIT $limit OFFSET $offset
  `;

  const friends = await db.namedQueryAll(sqlQuery, {
    user_id,
    search: search ? `%${search}%` : null,
    nearby_friend_ids: nearbyFriendIds,
    limit,
    offset,
  });

  return res.status(200).json(friends);
}