import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const countries = await db.queryAll('SELECT * FROM countries');
  return res.status(200).json(countries);
}