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

  const result = await db.queryOne(`
    INSERT INTO visited_countries (user_id, country_id)
    VALUES ($1, $2)
    RETURNING user_id, country_id
  `, [req.user.id, country_id]);

  const country = await db.queryOne(`
    SELECT id, name, code, dial_code
    FROM countries
    WHERE id = $1
  `, [result.country_id]);

  return res.status(200).json(country);
}