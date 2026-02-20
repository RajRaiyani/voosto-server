import { z } from 'zod';

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export default {
  place: () =>
    z
      .string()
      .trim()
      .min(1, 'Place is required')
      .max(255, 'Place must be less than 255 characters'),
  date: () =>
    z
      .string()
      .trim()
      .regex(dateOnlyRegex, 'Date must be YYYY-MM-DD')
      .optional()
      .nullable(),
};
