import { Request, Response, NextFunction } from 'express'; 
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { deleteNotification } from '../notification.service.js';

export const ValidationSchema = {
  params: z.object({
    notification_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { notification_id } = req.params as z.infer<typeof ValidationSchema.params>;

  const notification = await db.queryOne('SELECT id, user_id FROM notifications WHERE id = $1', [notification_id]);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  if (notification.user_id !== req.user.id) return res.status(403).json({ message: 'You are not allowed to delete this notification' });

  await deleteNotification(db, { id: notification_id });

  return res.status(204).send();
}