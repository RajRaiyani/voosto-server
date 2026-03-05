import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Env from '@/config/env.js';
import SocketService from '@/socket/index.js';
import Constant from '@/config/constant.js';


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {

  const user = await db.queryOne(`
    SELECT
      u.id, u.first_name, u.last_name, u.email, u.is_email_verified, u.is_profile_completed, u.created_at,
      u.phone_number, u.is_phone_number_verified,
      u.gender, u.date_of_birth, u.bio, u.interested_activity,
      u.settings,

      CASE WHEN f.id IS NOT NULL THEN ($1 || '/' || f.key) ELSE NULL END as profile_image_url,

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
            'meta_data', meta_data::jsonb
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
            t.meta_data::jsonb as meta_data
          FROM trips t
          LEFT JOIN conversations c ON c.place_id = t.place_id
          WHERE t.created_by = u.id AND (t.date IS NULL OR t.date > NOW())
          ORDER BY t.date DESC
          LIMIT 5
        )
      ) as recent_trips



    FROM users u
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE u.id = $2
  `, [Env.fileStorageEndpoint, req.user.id]);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const isOnline = await SocketService.isUserOnline(user.id);

  user.interested_activity_icon = Constant.user.interestedActivities.find(activity => activity.activity === user.interested_activity)?.icon;
  
  return res.status(200).json({ ...user, is_online: isOnline });
}