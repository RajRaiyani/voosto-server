import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Schema from '@/config/validationSchema.js';
import { z } from 'zod';
import SocketService from '@/socket.js';


export const ValidationSchema = {
  params: z.object({
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const currentUserId = req.user.id;

  const isBlocked = await db.queryOne(
    `
    SELECT 1
    FROM blocked_users ub
    WHERE (ub.blocker_id = $2 AND ub.blocked_id = $1) or (ub.blocker_id = $1 AND ub.blocked_id = $2)
  `,
    [currentUserId, user_id]
  );

  if (isBlocked) {
    return res.status(403).json({ code: 'BLOCKED', message: 'You cannot view this profile' });
  }

  const user = await db.queryOne(`
    SELECT
      u.id, u.first_name, u.last_name, u.email, u.is_email_verified, u.is_profile_completed, u.created_at,
      u.phone_number, u.is_phone_number_verified,
      u.gender, u.date_of_birth, u.bio,
      u.settings,

      (
        SELECT array_agg(
          json_build_object(
            'id', ac.id,
            'name', ac.name,
            'icon', ac.icon
          )
        ) as interested_activities
      FROM user_interested_activities uia
      LEFT JOIN activity_categories ac ON ac.id = uia.activity_category_id
      WHERE uia.user_id = u.id
      GROUP BY u.id
      ) as interested_activities,

      CASE WHEN f.id IS NOT NULL THEN f.url ELSE NULL END as profile_image_url,

      CASE WHEN c.id IS NOT NULL THEN
        json_build_object(
          'id', c.id,
          'name', c.name, 
          'code', c.code, 
          'dial_code', c.dial_code,
          'flag', c.flag
        )
      ELSE NULL END as country,

      (
        SELECT COUNT(*)::integer FROM activities a WHERE a.created_by = u.id
      ) as activity_count,

      (
        SELECT COUNT(*)::integer FROM trips t WHERE t.created_by = u.id
      ) as trip_count,

      (
        SELECT COUNT(*)::integer FROM friend_mappings fm WHERE (fm.sender_id = u.id OR fm.receiver_id = u.id) AND fm.status = 'accepted'
      ) as friend_count,

      (
        SELECT COUNT(*)::integer FROM user_posts up WHERE up.user_id = u.id
      ) as post_count,

      (
        SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM friend_mappings fm WHERE fm.status = 'accepted' AND ((fm.sender_id = $2 AND fm.receiver_id = u.id) OR (fm.sender_id = u.id AND fm.receiver_id = $2))
      ) as is_friend,

      (
        SELECT 
          json_build_object(
            'sender_id', sender_id,
            'receiver_id', receiver_id
          )
        FROM friend_mappings fm WHERE fm.status = 'pending' AND ((fm.sender_id = $2 AND fm.receiver_id = u.id) OR (fm.sender_id = u.id AND fm.receiver_id = $2))
        LIMIT 1
      ) as pending_friend_request,

      (
        SELECT COUNT(*)::integer FROM visited_countries vc WHERE vc.user_id = u.id
      ) as visited_countries_count,

      (
        SELECT array_agg(
          json_build_object(
            'id', c.id,
            'name', c.name,
            'code', c.code,
            'dial_code', c.dial_code,
            'flag', c.flag
          )
        )
        FROM visited_countries vc
        LEFT JOIN countries c ON c.id = vc.country_id
        WHERE vc.user_id = u.id
      ) as visited_countries,

      (
        SELECT array_agg(
          json_build_object(
            'id', id,
            'name', place_name,
            'place_id', place_id,
            'date', date,
            'conversation_id', conversation_id,
            'country', country
          )
        )
        FROM (
          SELECT 
            t.id, 
            t.place_name, 
            t.place_id, 
            t.date, 
            t.created_at,
            c.id as conversation_id,
            CASE WHEN cn.id IS NOT NULL THEN
              json_build_object(
                'id', cn.id,
                'name', cn.name,
                'code', cn.code,
                'dial_code', cn.dial_code,
                'flag', cn.flag
              )
            ELSE NULL END as country
          FROM trips t
          LEFT JOIN countries cn ON cn.code = t.country_code
          LEFT JOIN conversations c ON c.place_id = t.place_id
          WHERE t.created_by = u.id AND (t.date IS NULL OR t.date > NOW())
          ORDER BY t.date DESC
          LIMIT 5
        )
      ) as recent_trips

    FROM users u
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE u.id = $1
  `, [user_id, currentUserId]);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const isOnline = await SocketService.isUserOnline(user.id);

  return res.status(200).json({ ...user, is_online: isOnline });
}