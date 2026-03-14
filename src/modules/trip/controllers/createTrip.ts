import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import TripValidation from '../trip.validation.js';
import { createConversation } from '@/modules/conversation/conversation.service.js';

export const ValidationSchema = {
  body: z.object({
    place_name: z.string(),
    place_id: z.string().trim().min(1, 'Place ID is required'),
    date: TripValidation.date(),
    country_code: z.string().optional(),
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
    country_code,
  } = req.body as z.infer<typeof ValidationSchema.body>;


  const existingTrip = await db.queryOne('SELECT id FROM trips WHERE created_by = $1 AND place_id = $2', [req.user.id, place_id]);
  if (existingTrip) return res.status(400).json({ message: 'Trip already exists' });

  let placeConversation = await db.queryOne('SELECT id, name FROM conversations WHERE place_id = $1', [place_id]);
  let country = null;

  if (!placeConversation) {
    if (!country_code) return res.status(400).json({ message: 'Country code is required' });
    
    country = await db.queryOne('SELECT id, name, code, dial_code, flag FROM countries WHERE code = $1', [country_code]);
    if (!country) return res.status(400).json({ message: 'Country not found' });
  }

  try {
    await db.begin();

    const trip = await db.queryOne(
      `
      INSERT INTO trips (
        place_id,
        place_name,
        date,
        created_by,
        country_code
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        place_id,
        place_name,
        date ?? null,
        req.user.id,
        country_code,
      ]
    );


    if (!placeConversation) {

      placeConversation = await createConversation(db, {
        name: place_name,
        place_id: place_id,
        is_group: true,
        is_private: false,
        is_womans_only: false,
        is_deletable: false,
        members: [],
      });

      await db.query(`
        UPDATE conversations SET display_emoji = (
          SELECT flag FROM countries WHERE code = $1
        ) WHERE id = $2
        `, [country_code, placeConversation.id]);
    }

    await db.commit();

    return res.status(200).json({ ...trip, conversation: placeConversation });
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
