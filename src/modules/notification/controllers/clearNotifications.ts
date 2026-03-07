import { Request, Response, NextFunction } from 'express'; 
import { DatabaseClient } from '@/service/database/index.js';
import { clearUserNotifications } from '../notification.service.js';



export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  await clearUserNotifications(db, req.user.id);

  return res.status(204).send();
}