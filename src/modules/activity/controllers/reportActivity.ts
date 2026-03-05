import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { createReportInquiry } from '@/modules/report_inquiries/reportInquiries.service.js';


export const ValidationSchema = {
  params: z.object({
    activity_id: ConfigValidationSchema.uuid(),
  }),
  body: z.object({
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000, 'Message must be less than 500 characters'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { activity_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { message } = req.body as z.infer<typeof ValidationSchema.body>;


  const existingActivity = await db.queryOne('SELECT id FROM activities WHERE id = $1', [activity_id]);
  if (!existingActivity) return res.status(404).json({ message: 'Activity not found' });

  const inquiry = await createReportInquiry({ database: db }, {
    created_by: req.user.id,
    type: 'activity',
    reference_id: activity_id,
    body: message,
  });

  return res.status(200).json(inquiry);
}