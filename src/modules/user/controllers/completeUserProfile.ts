import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import Schema from '@/config/validationSchema.js';

export const ValidationSchema = {
  body: z.object({
    gender: z.enum(['male', 'female', 'other']).optional(),
    first_name: z.string().trim().min(1).max(50, 'First name must be less than 50 characters').optional(),
    last_name: z.string().trim().min(1).max(50, 'Last name must be less than 50 characters').optional(),
    phone_number: z.string().trim().min(4).max(15, 'Phone number must be less than 15 characters').optional(),
    date_of_birth: z.coerce.date().optional(),
    country_id: Schema.uuid().optional(),
    bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
    interested_activities: z.array(Schema.uuid()).min(1, 'At least one interested activity is required').optional(),
    heard_about_us: z.string().trim().max(150, 'Heard about us must be less than 150 characters').optional(),
    profile_image_id: Schema.uuid().optional(),
  }).refine(
    val => Object.keys(val).length > 0,
    { message: 'At least one key must be present in the request body.' }
  ),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { profile_image_id, interested_activities, gender, first_name, last_name, phone_number, date_of_birth, country_id, bio, heard_about_us } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.is_profile_completed) return res.status(400).json({ message: 'User profile already completed' });


  try{
    await db.begin();

    const updateQueryArray = [];
    if (gender) updateQueryArray.push('gender = $gender');
    if (first_name) updateQueryArray.push('first_name = $first_name');
    if (last_name) updateQueryArray.push('last_name = $last_name');
    if (phone_number) updateQueryArray.push('phone_number = $phone_number');
    if (date_of_birth) updateQueryArray.push('date_of_birth = $date_of_birth');
    if (country_id) updateQueryArray.push('country_id = $country_id');
    if (bio) updateQueryArray.push('bio = $bio');
    if (heard_about_us) updateQueryArray.push('heard_about_us = $heard_about_us');
    if (profile_image_id) updateQueryArray.push('profile_image_id = $profile_image_id');

    const updatedUser = await db.namedQueryOne(`
      UPDATE users
        SET ${updateQueryArray.join(', ')}
      WHERE id = $id
      RETURNING *
    `, { id: req.user.id, gender, first_name, last_name, phone_number, date_of_birth, country_id, bio, heard_about_us, profile_image_id });


    if (profile_image_id) {
      await db.query('UPDATE files SET _status = $1 WHERE id = $2', ['saved', profile_image_id ]);
    }

    if (interested_activities) {
      await db.query('DELETE FROM user_interested_activities WHERE user_id = $1', [req.user.id]);
      await db.query(`
        INSERT INTO user_interested_activities (user_id, activity_category_id) 
        SELECT $1, id FROM activity_categories WHERE id = ANY($2)
      `, [req.user.id, interested_activities]);
    }

    let isProfileCompleted = false;
    if (updatedUser.gender && updatedUser.date_of_birth && updatedUser.country_id && interested_activities.length > 0 && updatedUser.first_name && updatedUser.last_name) {
      await db.query('UPDATE users SET is_profile_completed = $1 WHERE id = $2', [true, req.user.id]);
      isProfileCompleted = true;
    }

    await db.commit();

    return res.status(200).send({ is_profile_completed: isProfileCompleted });
  } catch (error) {
    await db.rollback();
    throw error;
  }
}