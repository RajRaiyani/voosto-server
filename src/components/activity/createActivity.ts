import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  body: z.object({
    description: ConfigValidationSchema.description(),
    category: z
      .string()
      .trim()
      .max(100, 'Category must be less than 100 characters')
      .optional(),
    location: ConfigValidationSchema.location().optional(),
    date: z.coerce.date(),
    time: z
      .string()
      .trim()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
        { message: 'Time must be in HH:MM or HH:MM:SS 24h format' }
      )
      .optional(),
    is_private: z.boolean().optional().default(false),
    is_womans_only: z.boolean().optional().default(false),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const {
    description,
    category,
    location,
    date,
    time,
    is_private,
    is_womans_only,
  } = req.body as z.infer<typeof ValidationSchema.body>;

  const activity = await db.queryOne(
    `
      INSERT INTO activities (
        description,
        category,
        latitude,
        longitude,
        date,
        time,
        is_private,
        is_womans_only,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        description,
        category,
        latitude,
        longitude,
        date,
        time,
        is_private,
        is_womans_only,
        created_at,
        created_by,
        updated_at
    `,
    [
      description,
      category ?? null,
      location ? location.latitude : null,
      location ? location.longitude : null,
      date ?? null,
      time ?? null,
      is_private ?? false,
      is_womans_only ?? false,
      req.user.id,
    ]
  );

  return res.status(201).json({
    message: 'Activity created successfully',
    activity,
  });
}
