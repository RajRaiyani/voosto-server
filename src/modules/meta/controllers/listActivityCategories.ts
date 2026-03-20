import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const activityCategories = await db.queryAll(`
    SELECT
      id,
      name,
      icon,
      description
    FROM activity_categories
    ORDER BY name ASC
  `);
  return res.status(200).json(activityCategories);
}