import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ConfigValidationSchema from '../../config/validationSchema.js';
import RedisClient from '@/service/redis/index.js';

export const ValidationSchema = {
  body: z.object({
    location: ConfigValidationSchema.location(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction) {
  const { location } = req.body as z.infer<typeof ValidationSchema.body>;

  const existingUser = await RedisClient.geoPos('user:locations', `user:${req.user.id}`);
  console.log(existingUser);

  await RedisClient.geoAdd('user:locations', 
    {
      longitude: location.longitude,
      latitude: location.latitude,
      member: `user:${req.user.id}`,
    }
  );

  return res.status(200).json({ message: 'Location updated successfully' });
}