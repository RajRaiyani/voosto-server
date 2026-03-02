import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import TripValidation from '../trip.validation.js';
import { createConversation } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
  body: z.object({
    place_name: z.string(),
    place_id: z.string().trim().min(1, 'Place ID is required'),
    date: TripValidation.date(),
    meta_data: z.record(z.string(), z.any()).default({}),
    country_code: z.string(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const {
    place_name,
    place_id,
    date,
    meta_data,
    country_code,
  } = req.body as z.infer<typeof ValidationSchema.body>;


  const existingTrip = await db.queryOne('SELECT id FROM trips WHERE created_by = $1 AND place_id = $2', [req.user.id, place_id]);
  if (existingTrip) return res.status(400).json({ message: 'Trip already exists' });

  const country = await db.queryOne('SELECT id, name, code, dial_code, flag FROM countries WHERE code = $1', [country_code]);

  try {
    await db.begin();

    const trip = await db.queryOne(
      `
      INSERT INTO trips (
        place_id,
        place_name,
        date,
        created_by,
        meta_data
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        place_id,
        place_name,
        date ?? null,
        req.user.id,
        { ...(meta_data ?? {}), country: country }
      ]
    );


    let placeConversation = await db.queryOne('SELECT id, name, meta_data FROM conversations WHERE place_id = $1', [place_id]);
    if (!placeConversation) {
      placeConversation = await createConversation(db, {
        name: place_name,
        place_id: place_id,
        is_group: true,
        is_private: false,
        is_womans_only: false,
        is_deletable: false,
        meta_data: {
          country: country,
        },
        members: [],
      });
    }

    await db.commit();

    return res.status(200).json({ ...trip, conversation: placeConversation });
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
