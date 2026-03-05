import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

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
    'SELECT id, created_by FROM trips WHERE id = $1 and created_by = $2',
    [trip_id, userId]
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  await db.query('DELETE FROM trips WHERE id = $1', [trip_id]);

  return res.status(204).send();
}
