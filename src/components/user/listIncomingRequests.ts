import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const user_id = req.user.id;

  const incomingRequests = await db.queryAll(`
    SELECT 
      fm.sender_id,
      fm.receiver_id,
      fm.status,
      fm.created_at,
      
      u.id as user_id,
      u.first_name,
      u.last_name,
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
      ELSE NULL END as country
      
    FROM friend_mappings fm
    INNER JOIN users u ON u.id = fm.sender_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE fm.receiver_id = $1 AND fm.status = 'pending'
    ORDER BY fm.created_at DESC
  `, [ user_id]);

  return res.status(200).json(incomingRequests);
}