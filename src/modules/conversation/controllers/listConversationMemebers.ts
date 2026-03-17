import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  params: z.object({
    conversation_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) { 
  const { conversation_id } = req.params as z.infer<typeof ValidationSchema.params>;

  const members = await db.queryAll(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        f.url as profile_image_url,
        cm.joined_at,
        cm.is_admin,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'code', c.code,
          'dial_code', c.dial_code,
          'flag', c.flag
        ) as country
      FROM conversation_members cm
      LEFT JOIN users u ON u.id = cm.user_id
      LEFT JOIN countries c ON c.id = u.country_id
      LEFT JOIN files f ON f.id = u.profile_image_id
      WHERE cm.conversation_id = $1 and u.is_deleted = false
    `, [conversation_id]);

  return res.status(200).json(members);
}