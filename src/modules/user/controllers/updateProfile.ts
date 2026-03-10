import { z } from 'zod';
import UserSchema from '@/modules/user/user.validation.js';
import Schema from '@/config/validationSchema.js';
import { saveFile, deleteFile } from '@/modules/file/file.service.js';
import { DatabaseClient } from '@/service/database/index.js';
import { Request, Response, NextFunction } from 'express';

export const ValidationSchema = {
  body: z.object({
    first_name: UserSchema.firstName().optional(),
    last_name: UserSchema.lastName().optional(),
    phone_number: Schema.phoneNumber().optional(),
    gender: Schema.gender().optional(),
    date_of_birth: z.coerce.date().optional(),
    country_id: Schema.uuid().optional(),
    bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
    interested_activities: z.array(Schema.uuid()).min(1, 'At least one interested activity is required').optional(),
    profile_image_id: Schema.uuid().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const updateData = req.body;

  try {

    await db.begin();

    if (updateData.profile_image_id) await saveFile({ database:db }, { id: updateData.profile_image_id });

    // Build dynamic update query
    const updateQueryArray = [];
    if (updateData.first_name) updateQueryArray.push('first_name = $first_name');
    if (updateData.last_name) updateQueryArray.push('last_name = $last_name');
    if (updateData.phone_number) updateQueryArray.push('phone_number = $phone_number');
    if (updateData.gender) updateQueryArray.push('gender = $gender');
    if (updateData.date_of_birth) updateQueryArray.push('date_of_birth = $date_of_birth');
    if (updateData.country_id) updateQueryArray.push('country_id = $country_id');
    if (updateData.bio) updateQueryArray.push('bio = $bio');
    if (updateData.profile_image_id) updateQueryArray.push('profile_image_id = $profile_image_id');

    const setClause = [...updateQueryArray, 'updated_at = NOW()'].join(', ');

    const updatedUser = await db.namedQueryOne(
      `
      UPDATE users 
      SET ${setClause}
      WHERE id = $id
      RETURNING 
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
        profile_image_id,
        is_profile_completed,
        created_at,
        updated_at
      `,
      { ...updateData, id: req.user.id }
    );

    if (updateData.interested_activities) {
      await db.query('DELETE FROM user_interested_activities WHERE user_id = $1', [req.user.id]);
      await db.query(`
        INSERT INTO user_interested_activities (user_id, activity_category_id) 
        SELECT $1, id FROM activity_categories WHERE id = ANY($2)
      `, [req.user.id, updateData.interested_activities]);
    }

    // Delete old profile image if it was changed
    if (updatedUser.profile_image_id && updatedUser.old_profile_image_id && 
      updatedUser.profile_image_id !== updatedUser.old_profile_image_id) {
      deleteFile({ database:db }, { id: updatedUser.old_profile_image_id });
    }

    // Commit transaction
    await db.commit();

    return res.status(204).send();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}