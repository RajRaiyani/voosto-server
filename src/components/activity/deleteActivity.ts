import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { deleteActivity } from './activity.service.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';


export const ValidationSchema = {
  params: z.object({
    activity_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { activity_id } = req.params as z.infer<typeof ValidationSchema.params>;

  const activity = await db.queryOne('SELECT id, created_by FROM activities WHERE id = $1', [activity_id]);
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  if (activity.created_by !== req.user.id) return res.status(403).json({ message: 'You are not allowed to delete this activity' });

  await deleteActivity(db, activity_id);
  return res.status(204).send();
}