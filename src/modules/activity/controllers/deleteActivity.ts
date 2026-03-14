import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';


export const ValidationSchema = {
  params: z.object({
    activity_id: ConfigValidationSchema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { activity_id } = req.params as z.infer<typeof ValidationSchema.params>;

  const activity = await db.queryOne('SELECT id, created_by, conversation_id FROM activities WHERE id = $1', [activity_id]);
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  if (activity.created_by !== req.user.id) return res.status(403).json({ message: 'You are not allowed to delete this activity' });

  try{
    await db.begin();
    await db.query('DELETE FROM activities WHERE id = $1', [activity_id]);
    await db.query('UPDATE conversation_members SET is_admin = false WHERE conversation_id = $1 AND user_id = $2', [activity.conversation_id, activity.created_by]);
  }catch(error){
    await db.rollback();
    throw error;
  }

  return res.status(204).send();
}