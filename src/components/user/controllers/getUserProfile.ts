import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Schema from '@/config/validationSchema.js';
import { z } from 'zod';
import SocketService from '@/socket/index.js';


export const ValidationSchema = {
  params: z.object({
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const currentUserId = req.user.id;

  const user = await db.queryOne(`
    SELECT
      u.id, u.first_name, u.last_name, u.email, u.is_email_verified, u.is_profile_completed, u.created_at,
      u.phone_number, u.is_phone_number_verified,
      u.gender, u.date_of_birth, u.bio, u.interested_activity,
      u.settings,

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
        SELECT COUNT(*)::integer FROM friend_mappings fm WHERE fm.sender_id = u.id OR fm.receiver_id = u.id
      ) as friend_count,

      (
        SELECT COUNT(*)::integer FROM user_posts up WHERE up.user_id = u.id
      ) as post_count,

      (
        SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM friend_mappings fm WHERE fm.status = 'accepted' AND ((fm.sender_id = $2 AND fm.receiver_id = u.id) OR (fm.sender_id = u.id AND fm.receiver_id = $2))
      ) as is_friend,

      (
        SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM friend_mappings fm WHERE fm.status = 'pending' AND ((fm.sender_id = $2 AND fm.receiver_id = u.id) OR (fm.sender_id = u.id AND fm.receiver_id = $2))
      ) as has_pending_friend_request,

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
            'name', place,
            'date', date
          )
        )
        FROM (
          SELECT t.id, t.place, t.date, t.created_at
          FROM trips t
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