import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import RedisClient from '@/service/redis/index.js';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  query: z.object({
    offset: z.number().optional(),
    limit: z.number().optional(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;
  const userId = req.user.id;
  const location = req.validatedQuery.location;

  const users = await db.queryAll(`
    SELECT * FROM users WHERE id != $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  return res.status(200).json(users);
}