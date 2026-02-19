import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import TripValidation from './trip.validation.js';
import { createConversation } from '@/components/conversation/conversation.service.js';

export const ValidationSchema = {
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
  const {
    place,
    date,
  } = req.body as z.infer<typeof ValidationSchema.body>;

  try {
    await db.begin();

    const conversation = await createConversation(db, {
      name: place.slice(0, 200),
      is_group: true,
      is_private: false,
      is_womans_only: false,
      members: [{ id: req.user.id, is_admin: true }],
    });

    const trip = await db.queryOne(
      `
      INSERT INTO trips (
        conversation_id,
        place,
        date,
        created_by
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        conversation.id,
        place,
        date ?? null,
        req.user.id,
      ]
    );

    await db.commit();

    return res.status(200).json(trip);
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
