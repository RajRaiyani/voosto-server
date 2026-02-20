import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  params: z.object({
    country_id: Schema.uuid(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) { 
  const { country_id } = req.params as z.infer<typeof ValidationSchema.params>;

  await db.query(`
    DELETE FROM visited_countries vc
    WHERE vc.user_id = $1 AND vc.country_id = $2
    RETURNING vc.user_id, vc.country_id
  `, [req.user.id, country_id]);

  return res.status(204).send();
}