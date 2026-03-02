import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isMemberOfConversation } from '@/components/conversation/conversation.service.js';

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
    'SELECT * FROM trips WHERE id = $1 and created_by = $2',
    [trip_id, userId]
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  let isMember = false;
  if (trip.conversation_id) {
    isMember = await isMemberOfConversation(db, trip.conversation_id, userId);
  }

  const conversation = await db.queryOne(`
      SELECT 
        c.id,
        c.name,
        c.is_group,
        c.is_private,
        c.is_womans_only,
        c.created_at,
        c.display_picture_id,
        c.meta_data,
        c.place_id,
        c.place_name,
        c.is_deletable,
        c.created_at,
        $2 AS is_member,
        CASE WHEN f.id IS NOT NULL THEN f.url ELSE NULL END AS display_picture_url
      FROM conversations c
      LEFT JOIN files f ON f.id = c.display_picture_id
      WHERE c.id = $1
    `, [trip.conversation_id, isMember]);



  return res.status(200).json({ ...trip, conversation, is_member: isMember });
}
