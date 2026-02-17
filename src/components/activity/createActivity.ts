import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { DatabaseClient } from '@/service/database/index.js';
import ActivityValidation from './activity.validation.js';
import RedisClient from '@/service/redis/index.js';
import { createConversation } from '@/components/conversation/conversation.service.js';


export const ValidationSchema = {
  body: z.object({
    description: ActivityValidation.description(),
    category: ActivityValidation.category(),
    location: ConfigValidationSchema.location(),
    date: ActivityValidation.date(),
    time: ActivityValidation.time().nullish().optional(),
    is_private: z.boolean().default(false),
    is_womans_only: z.boolean().default(false),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const {
    description,
    category,
    location,
    date,
    time,
    is_private,
    is_womans_only,
  } = req.body as z.infer<typeof ValidationSchema.body>;

  try{
    await db.begin();

    const conversation = await createConversation(db, {
      name: description.slice(0, 200), 
      is_group: true, 
      is_private: is_private, 
      is_womans_only: is_womans_only, 
      members: [{ id: req.user.id, is_admin: true }] 
    });

    const activity = await db.queryOne(
      `
        INSERT INTO activities (
          description,
          category,
          latitude,
          longitude,
          date,
          time,
          created_by,
          conversation_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        description,
        category,
        location.latitude,
        location.longitude,
        date,
        time ?? null,
        req.user.id,
        conversation.id,
      ]
    );

    if (activity && activity.latitude && activity.longitude) {
      await RedisClient.geoAdd('geo:activity', {
        longitude: activity.longitude,
        latitude: activity.latitude,
        member: activity.id,
      });
    }

    await db.commit();

    return res.status(200).json(activity);
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
