import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { listUserNotifications } from './notification.service.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    offset: Schema.pagination.offset(),
    limit: Schema.pagination.limit(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

  const notifications = await listUserNotifications(db, req.user.id, { offset, limit });

  return res.status(200).json(notifications);
}