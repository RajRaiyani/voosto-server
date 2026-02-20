import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';


export const ValidationSchema = {
  params: z.object({
    activity_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { activity_id } = req.params as z.infer<typeof ValidationSchema.params>;

  const user = await db.queryOne('SELECT id, gender FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMan = user.gender === 'male' ? true : false;

  let whereClause = ' a.id = $1 ';

  if (isMan) whereClause += ' AND c.is_womans_only = FALSE ';

  const sqlQuery = `
    SELECT
      a.id,
      a.description,
      a.category,
      a.latitude,
      a.longitude,
      a.date,
      a.time,
      a.created_at,

      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'full_name', u.full_name,
        'email', u.email,
        'profile_image_url', f.url
      ) as created_by,

      json_build_object(
        'id', c.id,
        'name', c.name,
        'is_group', c.is_group,
        'is_private', c.is_private,
        'is_womans_only', c.is_womans_only,
        'member_count', COUNT(cm.user_id)
      ) as conversation

    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN conversations c ON c.id = a.conversation_id
    LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE ${whereClause}
    GROUP BY a.id, c.id, u.id, f.id
  `;
  

  const activity = await db.queryOne(sqlQuery, [activity_id]);

  
  return res.status(200).json(activity);
}