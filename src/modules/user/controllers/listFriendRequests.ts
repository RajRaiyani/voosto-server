import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const user_id = req.user.id;

  const incomingRequests = await db.queryAll(`
    SELECT 
      fm.status,
      fm.created_at,

      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'gender', u.gender,
        'bio', u.bio,
        'profile_image_url', f.url,
        'country', json_build_object(
          'id', c.id,
          'name', c.name,
          'code', c.code,
          'dial_code', c.dial_code,
          'flag', c.flag
        )
      ) as sender
      
    FROM friend_mappings fm
    INNER JOIN users u ON u.id = fm.sender_id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE fm.receiver_id = $1 AND fm.status = 'pending'
    ORDER BY fm.created_at DESC
  `, [ user_id]);

  return res.status(200).json(incomingRequests);
}