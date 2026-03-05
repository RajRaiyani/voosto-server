import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { DatabaseClient } from '@/service/database/index.js';
import { createReportInquiry } from '@/modules/report_inquiries/reportInquiries.service.js';

export const ValidationSchema = {
  params: z.object({
    user_id: ConfigValidationSchema.uuid(),
  }),
  body: z.object({
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message must be less than 500 characters'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { user_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { message } = req.body as z.infer<typeof ValidationSchema.body>;

  const existingUser = await db.queryOne('SELECT id FROM users WHERE id = $1', [user_id]);
  if (!existingUser) return res.status(404).json({ message: 'User not found' });

  const inquiry = await createReportInquiry(
    { database: db },
    {
      created_by: req.user.id,
      type: 'user',
      reference_id: user_id,
      body: message,
    }
  );

  return res.status(200).json(inquiry);
}

