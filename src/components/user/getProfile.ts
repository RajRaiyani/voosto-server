import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Env from '@/config/env.js';


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {

  const user = await db.queryOne(`--sql
    SELECT
      u.id, u.first_name, u.last_name, u.email, u.is_email_verified, u.is_profile_completed, u.created_at,
      u.phone_number, u.is_phone_number_verified,
      u.gender, u.date_of_birth, u.bio, u.interested_activity,

      CASE WHEN f.id IS NOT NULL THEN ($1 || '/' || f.key) ELSE NULL END as profile_image_url,

      CASE WHEN c.id IS NOT NULL THEN
        json_build_object(
          'id', c.id,
          'name', c.name, 
          'code', c.code, 
          'dial_code', c.dial_code
        )
      ELSE NULL END as country,

      (
        SELECT COUNT(*)::integer FROM activities a WHERE a.created_by = u.id
      ) as activity_count,

      (
        SELECT COUNT(*)::integer FROM friend_mappings fm WHERE fm.sender_id = u.id OR fm.receiver_id = u.id
      ) as friend_count,

      (
        SELECT COUNT(*)::integer FROM user_posts up WHERE up.user_id = u.id
      ) as post_count

    FROM users u
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE u.id = $2
  `, [Env.fileStorageEndpoint, req.user.id]);

  if (!user) return res.status(404).json({ message: 'User not found' });

  return res.status(200).json(user);
}