import { z } from 'zod';
import UserSchema from './user.validation.js';
import ConfigValidationSchema from '../../config/validationSchema.js';
import { deleteFile } from '@/service/file-storage/index.js';

export const ValidationSchema = {
  body: z.object({
    first_name: UserSchema.firstName().optional(),
    last_name: UserSchema.lastName().optional(),
    phone_number: ConfigValidationSchema.phoneNumber().optional(),
    gender: ConfigValidationSchema.gender().optional(),
    date_of_birth: z.date().optional(),
    country_id: ConfigValidationSchema.uuid().optional(),
    bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
    interested_activity: UserSchema.interestedActivity().optional(),
    profile_image: ConfigValidationSchema.uuid().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
};

export async function Controller(req, res, next, db) {
  const userId = req.user.id;
  const updateData = req.body;

  // Check if user exists
  const existingUser = await db.queryOne(
    'SELECT id, profile_image FROM users WHERE id = $1',
    [userId]
  );

  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // If country_id is provided, verify it exists
  if (updateData.country_id) {
    const country = await db.queryOne(
      'SELECT id FROM countries WHERE id = $1',
      [updateData.country_id]
    );

    if (!country) {
      return res.status(400).json({ message: 'Invalid country_id' });
    }
  }

  // If profile_image is provided, verify it exists
  if (updateData.profile_image) {
    const file = await db.queryOne(
      'SELECT id FROM files WHERE id = $1',
      [updateData.profile_image]
    );

    if (!file) {
      return res.status(400).json({ message: 'Invalid profile_image file_id' });
    }
  }

  try {
    // Begin transaction
    await db.query('BEGIN');

    // Build dynamic update query
    const fields = Object.keys(updateData);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    const values = [userId, ...fields.map((field) => updateData[field])];

    // Update user profile
    const updatedUser = await db.queryOne(
      `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
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
        interested_activity,
        profile_image,
        is_profile_completed,
        created_at,
        updated_at
      `,
      values
    );

    // Delete old profile image if it was changed
    if (updateData.profile_image && existingUser.profile_image && 
        existingUser.profile_image !== updateData.profile_image) {
      try {
        const oldFile = await db.queryOne(
          'SELECT key FROM files WHERE id = $1',
          [existingUser.profile_image]
        );

        if (oldFile) {
          // Delete physical file
          await deleteFile(oldFile.key);

          // Delete file record
          await db.query('DELETE FROM files WHERE id = $1', [
            existingUser.profile_image,
          ]);
        }
      } catch (error) {
        // Log error but don't fail the request
        console.error('Error deleting old profile image:', error);
      }
    }

    // Commit transaction
    await db.query('COMMIT');

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    throw error;
  }
}