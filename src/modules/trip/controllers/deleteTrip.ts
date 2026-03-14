import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { removeMemberFromConversation } from '@/modules/conversation/conversation.service.js';


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

  try{
    await db.begin();
    await db.query('DELETE FROM trips WHERE id = $1', [trip_id]);
    const conversation = await db.queryOne('SELECT id FROM conversations WHERE place_id = $1', [trip.place_id]);
    await removeMemberFromConversation({ database: db }, conversation?.id, userId);

    await db.commit();
  }catch(error){
    await db.rollback();
    throw error;
  }

  return res.status(204).send();
}
