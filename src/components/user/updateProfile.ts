import { z } from 'zod';
import UserSchema from './user.validation.js';
import ConfigValidationSchema from '../../config/validationSchema.js';
import { SaveFile, DeleteFile } from '@/components/file/file.service.js';
import { DatabaseClient } from '@/service/database/index.js';
import { Request, Response, NextFunction } from 'express';

export const ValidationSchema = {
  body: z.object({
    first_name: UserSchema.firstName().optional(),
    last_name: UserSchema.lastName().optional(),
    phone_number: ConfigValidationSchema.phoneNumber().optional(),
    gender: ConfigValidationSchema.gender().optional(),
    date_of_birth: z.coerce.date().optional(),
    country_id: ConfigValidationSchema.uuid().optional(),
    bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
    interested_activity: UserSchema.interestedActivity().optional(),
    profile_image_id: ConfigValidationSchema.uuid().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const updateData = req.body;

  try {

    await db.begin();

    if (updateData.profile_image_id) await SaveFile(db, updateData.profile_image_id);

    // Build dynamic update query
    const fields = Object.keys(updateData);
    const setClause = fields
      .map((field) => ` ${field} = $${field} `)
      .join(', ');

    const updatedUser = await db.namedQueryOne(
      `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $id
      RETURNING 
        old.profile_image_id as old_profile_image_id,
        id, 
        first_name, 
        last_name, 
        full_name,
        email, 
        phone_number,
        gender,
        date_of_birth,
        country_id,
        bio,
        interested_activity,
        profile_image_id,
        is_profile_completed,
        created_at,
        updated_at
      `,
      { ...updateData, id: req.user.id }
    );

    // Delete old profile image if it was changed
    if (updatedUser.profile_image_id && updatedUser.old_profile_image_id && 
      updatedUser.profile_image_id !== updatedUser.old_profile_image_id) {
      DeleteFile(db, updatedUser.old_profile_image_id);
    }

    // Commit transaction
    await db.commit();

    return res.status(204).send();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}