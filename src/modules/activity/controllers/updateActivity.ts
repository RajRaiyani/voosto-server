import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import ActivityValidation from './activity.validation.js';



export const ValidationSchema = {
  params: z.object({
    activity_id: ConfigValidationSchema.uuid(),
  }),
  body: z.object({
    description: ActivityValidation.description(),
    category_id: ConfigValidationSchema.uuid(),
    location: ConfigValidationSchema.location(),
    date: ActivityValidation.date(),
    time: ActivityValidation.time().nullish().optional(),
    is_private: z.boolean().default(false),
    is_womans_only: z.boolean().default(false),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { activity_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { description, category_id, location, date, time, is_private, is_womans_only } = req.body as z.infer<typeof ValidationSchema.body>;

  try {
    await db.begin();

    const activity = await db.queryOne('SELECT id, conversation_id, created_by FROM activities WHERE id = $1', [activity_id]);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    if (activity.created_by !== req.user.id) return res.status(403).json({ message: 'You are not allowed to update this activity' });
    
    await db.query(`
      UPDATE activities
      SET 
        description = $1, 
        category_id = $2, 
        latitude = $3,
        longitude = $4,
        date = $5, 
        time = $6
      WHERE id = $7
      RETURNING *
      `, [description, category_id, location.latitude, location.longitude, date, time, activity_id]);

    await db.query(`
        UPDATE conversations
        SET 
          is_private = $1, 
          is_womans_only = $2
        WHERE id = $3
        RETURNING *
      `, [is_private, is_womans_only, activity.conversation_id]);
    await db.commit();
    
    return res.status(204).send();

  } catch (error) {
    await db.rollback();
    throw error;
  }
}