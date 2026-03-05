import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import TripValidation from '@/modules/trip/trip.validation.js';

export const ValidationSchema = {
  params: z.object({
    trip_id: Schema.uuid(),
  }),
  body: z.object({
    date: TripValidation.date(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { trip_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { date } = req.body as z.infer<typeof ValidationSchema.body>;
  const userId = req.user!.id;

  const trip = await db.queryOne(
    'SELECT id, created_by, place_id FROM trips WHERE id = $1 and created_by = $2',
    [trip_id, userId]
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const updated = await db.queryOne(
    `
    UPDATE trips
    SET date = $1, updated_at = now()
    WHERE id = $2
    RETURNING *
    `,
    [date ?? null, trip_id]
  );

  return res.status(200).json(updated);
}
