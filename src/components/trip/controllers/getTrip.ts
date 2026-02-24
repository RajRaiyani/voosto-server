import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { ensureMember } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  params: z.object({
    trip_id: Schema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { trip_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const userId = req.user!.id;

  const trip = await db.queryOne(
    'SELECT id, conversation_id FROM trips WHERE id = $1',
    [trip_id]
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  await ensureMember(db, trip.conversation_id, userId);

  const sqlQuery = `
    SELECT
      t.id,
      t.place,
      t.date,
      t.created_at,
      t.updated_at,

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

    FROM trips t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN files f ON f.id = u.profile_image_id
    LEFT JOIN conversations c ON c.id = t.conversation_id
    LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE t.id = $1
    GROUP BY t.id, c.id, u.id, f.id
  `;

  const tripWithDetails = await db.queryOne(sqlQuery, [trip_id]);

  return res.status(200).json(tripWithDetails);
}
