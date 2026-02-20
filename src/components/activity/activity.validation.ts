import { z } from 'zod';
import Constants from '@/config/constant.js';

export default {
  category: () => z.enum(Constants.activities.categories.map(category => category.activity)),
  date: () => z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: () => z.string().trim().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  time: () => z
    .string()
    .trim()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
      { message: 'Time must be in HH:MM or HH:MM:SS 24h format' }
    )
};