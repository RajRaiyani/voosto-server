import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import UserSchema from './user.validation.js';

export const ValidationSchema = {
  body: z.object({
    gender: z.enum(['male', 'female']).optional(),
    date_of_birth: z.coerce.date().optional(),
    country_id: z.uuid({ version: 'v7', message: 'Invalid country id' }).optional(),
    bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
    interested_activity: UserSchema.interestedActivity().optional(),
    profile_image_id: z.uuid({ version: 'v7', message: 'Invalid profile image id' }).optional(),
  }).refine(
    val => Object.keys(val).length > 0,
    { message: 'At least one key must be present in the request body.' }
  ),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { profile_image_id } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.is_profile_completed) return res.status(400).json({ message: 'User profile already completed' });

  try{
    await db.query('BEGIN');

    const updateQuery = Object.keys(req.body).filter(key => req.body[key] !== undefined).map(key => `${key} = $${key}`).join(', ');

    const updatedUser = await db.namedQueryOne(`
      UPDATE users
        SET ${updateQuery}
      WHERE id = $id
      RETURNING *
    `, { id: req.user.id, ...req.body });


    if (profile_image_id) {
      await db.query('UPDATE files SET _status = $1 WHERE id = $2', ['saved', profile_image_id ]);
    }

    let isProfileCompleted = false;
    if (updatedUser.gender && updatedUser.date_of_birth && updatedUser.country_id && updatedUser.bio && updatedUser.interested_activity) {
      await db.query('UPDATE users SET is_profile_completed = $1 WHERE id = $2', [true, req.user.id]);
      isProfileCompleted = true;
    }

    await db.query('COMMIT');

    return res.status(200).send({ is_profile_completed: isProfileCompleted });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}