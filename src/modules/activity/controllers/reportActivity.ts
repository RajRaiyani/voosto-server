import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import ConfigValidationSchema from '@/config/validationSchema.js';
import { createReportInquiry } from '@/modules/report_inquiries/reportInquiries.service.js';
import { SendMail } from '@/service/mail/index.js';
import dataEmailTemplate from '@/utils/emailTemplates/data.js';
import env from '@/config/env.js';

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


  const existingActivity = await db.queryOne('SELECT * FROM activities WHERE id = $1', [activity_id]);
  if (!existingActivity) return res.status(404).json({ message: 'Activity not found' });

  const inquiry = await createReportInquiry({ database: db }, {
    created_by: req.user.id,
    type: 'activity',
    reference_id: activity_id,
    body: message,
  });

  const reporter = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);

  const emailHtml = dataEmailTemplate({
    reporter_id: reporter.id,
    reporter_name: reporter.full_name,
    reporter_email: reporter.email,
    activity_id: activity_id,
    activity_description: existingActivity.description,
    activity_date: existingActivity.date,
  });

  SendMail({
    to: env.informerEmail,
    subject: 'Activity Reported',
    html: emailHtml
  });

  return res.status(200).json(inquiry);
}