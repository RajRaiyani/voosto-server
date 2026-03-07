import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';


export const ValidationSchema = {
  params: z.object({
    user_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;

  const friends = await db.queryAll(`
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.full_name,
      u.email,
      u.gender,
      u.bio,
      f.url as profile_image_url,
      
      CASE WHEN c.id IS NOT NULL THEN
        json_build_object(
          'id', c.id,
          'name', c.name, 
          'code', c.code, 
          'dial_code', c.dial_code,
          'flag', c.flag
        )
      ELSE NULL END as country,
      
      fm.created_at as friends_since
      
    FROM friend_mappings fm
    INNER JOIN users u ON u.id = CASE 
      WHEN fm.sender_id = $1 THEN fm.receiver_id
      ELSE fm.sender_id
    END
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN countries c ON c.id = u.country_id
    WHERE (fm.sender_id = $1 OR fm.receiver_id = $1) 
      AND fm.status = 'accepted'
    ORDER BY fm.created_at DESC
  `, [user_id]);

  return res.status(200).json(friends);
}