import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import TripValidation from './trip.validation.js';

export const ValidationSchema = {
  params: z.object({
    trip_id: Schema.uuid(),
  }),
  body: z.object({
    place: TripValidation.place(),
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
  const { place, date } = req.body as z.infer<typeof ValidationSchema.body>;
  const userId = req.user!.id;

  const trip = await db.queryOne(
    'SELECT id, created_by FROM trips WHERE id = $1',
    [trip_id]
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (trip.created_by !== userId) {
    return res.status(403).json({ message: 'You are not allowed to update this trip' });
  }

  const updated = await db.queryOne(
    `
    UPDATE trips
    SET place = $1, date = $2, updated_at = now()
    WHERE id = $3
    RETURNING *
    `,
    [place, date ?? null, trip_id]
  );

  return res.status(200).json(updated);
}
