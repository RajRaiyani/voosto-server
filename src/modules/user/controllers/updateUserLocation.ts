import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ConfigValidationSchema from '../../../config/validationSchema.js';
import RedisClient from '@/service/redis/index.js';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  body: z.object({
    location: ConfigValidationSchema.location(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { location } = req.body as z.infer<typeof ValidationSchema.body>;


  await RedisClient.geoAdd('geo:user', 
    {
      longitude: location.longitude,
      latitude: location.latitude,
      member: req.user.id,
    }
  );

  await db.query(`
    UPDATE users
    SET longitude = $1, latitude = $2
    WHERE id = $3
  `, [location.longitude, location.latitude, req.user.id]);


  return res.status(204).send();
}