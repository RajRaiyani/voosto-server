import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Env from '@/config/env.js';

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const user_id = req.user.id;

  const friends = await db.queryAll(`
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.full_name,
      u.email,
      u.gender,
      u.bio,
      u.interested_activity,
      
      CASE WHEN f.id IS NOT NULL THEN f.url ELSE NULL END as profile_image_url,
      
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
      WHEN fm.sender_id = $2 THEN fm.receiver_id
      ELSE fm.sender_id
    END
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE (fm.sender_id = $2 OR fm.receiver_id = $2) 
      AND fm.status = 'accepted'
    ORDER BY fm.created_at DESC
  `, [Env.fileStorageEndpoint, user_id]);

  return res.status(200).json(friends);
}