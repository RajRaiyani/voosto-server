import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import RedisClient from '@/service/redis/index.js';
import Schema from '@/config/validationSchema.js';
import { LoadActivitiesToRedis } from '@/modules/activity/activity.script.js';


const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ValidationSchema = {
  query: z.object({
    search: z.string().trim().max(200, 'Search must be less than 100 characters').optional(),
    location: Schema.location().optional(),
    // in kilometers
    radius: z.coerce.number()
      .gt(0, 'Radius must be greater than 0 km')
      .max(5000, 'Radius must be less than 5000 km').optional(),
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
    date: z.string().trim().regex(dateOnlyRegex, 'Date must be YYYY-MM-DD').optional(),
    user_id: Schema.uuid().optional(),
    upcoming: z.string().trim().max(5).toLowerCase().transform(val =>{
      if (val?.toLowerCase() === 'true') return true;
      if (val?.toLowerCase() === 'false') return false;
      return val;
    }).optional(),
    timestamp: z.coerce.date().optional(),
  }).refine(
    (data) => data.upcoming === undefined || data.timestamp !== undefined,
    { message: 'timestamp is required when upcoming is provided', path: ['timestamp'] }
  ),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { search, location, radius, offset, limit, date, user_id, upcoming, timestamp } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  const user = await db.queryOne('SELECT id, gender FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });


  let whereClause = `
    not exists (select 1 from blocked_users bu where (
      (bu.blocker_id = a.created_by AND bu.blocked_id = $current_user_id)
      OR (bu.blocked_id = a.created_by AND bu.blocker_id = $current_user_id)
    ))
  `;
  let orderByClause = ' a.created_at DESC ';


  const notWoman = user.gender === 'male' || user.gender === 'other' ? true : false;
  
  let activity_ids: string[] = [];
  
  
  if (location) {

    // find if geo:activity has any record
    const activityCount = await RedisClient.zCard('geo:activity');

    if (Number(activityCount) === 0) {
      await LoadActivitiesToRedis();
    }

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

    whereClause += ' AND a.id = ANY($activity_ids) ';
    orderByClause = ' array_position($activity_ids, a.id::text) ASC ';
  }


  if (search) whereClause += ' AND LOWER(a.description) LIKE LOWER($search) ';
  if (date) whereClause += ' AND a.date = $date ';
  if (notWoman) whereClause += ' AND cwm.is_womans_only = FALSE ';
  if (user_id) whereClause += ' AND a.created_by = $user_id ';

  if (upcoming !== undefined) {
    const activityMoment = '(a.date + COALESCE(a.time, \'23:59\'::time))';
    if (upcoming) {
      whereClause += ` AND ${activityMoment} >= $timestamp `;
    } else {
      whereClause += ` AND ${activityMoment} < $timestamp `;
    }
  }


  const sqlQuery = `
    WITH conversations_with_members AS (
      SELECT
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
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
      a.id,
      a.description,
      a.latitude,
      a.longitude,
      a.date,
      a.time,
      a.created_at,
      
      a.category_id,
      ac.name as category,
      ac.icon as category_icon,

      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url,
        'country', json_build_object(
          'id', c.id,
          'name', c.name,
          'code', c.code,
          'dial_code', c.dial_code,
          'flag', c.flag
        )
      ) as created_by,

      COALESCE(ffm.members, '[]'::json) AS members,

      CASE WHEN cwm.id IS NOT NULL THEN
        json_build_object(
          'id', cwm.id,
          'name', cwm.name,
          'is_group', cwm.is_group,
          'is_private', cwm.is_private,
          'is_womans_only', cwm.is_womans_only,
          'member_count', cwm.member_count
        )
      ELSE NULL END as conversation

    FROM activities a
    LEFT JOIN activity_categories ac ON ac.id = a.category_id
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN countries c ON c.id = u.country_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN conversations_with_members cwm ON cwm.id = a.conversation_id
    LEFT JOIN first_five_members ffm ON ffm.conversation_id = cwm.id
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $limit OFFSET $offset
  `;

  const activities = await db.namedQueryAll(sqlQuery, {
    search: search ? `%${search}%` : null,
    activity_ids,
    current_user_id: req.user.id,
    date: date ?? null,
    limit,
    offset,
    user_id,
    timestamp: timestamp,
  });


  return res.status(200).json(activities);
}