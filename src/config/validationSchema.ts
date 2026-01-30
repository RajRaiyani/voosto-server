import z from 'zod';

const uuid = () => z.uuid({ version: 'v7' });

export default {
  uuid,
  name: () =>
    z
      .string()
      .trim()
      .min(5, 'Name must be at least 5 characters')
      .max(150, 'Name must be less than 150 characters')
      .regex(/^[a-zA-Z0-9 _-]*$/, {
        message: 'Name can only contain letters, numbers, spaces, and hyphens',
      }),

  imei: () => z.string().max(15, 'IMEI must be less than 15 characters'),

  timestamp: () =>
    z.codec(z.iso.datetime(), z.date(), {
      encode: (value) => value.toISOString(),
      decode: (value) => new Date(value),
    }),

  gender: () => z.enum(['male', 'female']),

  phoneNumber: () =>
    z
      .string()
      .regex(/^[0-9]{10}$/, { message: 'Phone number must be 10 digits' }),

  email: () => z.email({ message: 'Invalid email address' }),
  address: () =>
    z
      .string()
      .trim()
      .min(3, 'Address must be at least 3 characters')
      .max(500, 'Address must be less than 500 characters'),

  month: () =>
    z
      .number()
      .int()
      .min(0, 'Month must be greater than 0')
      .max(11, 'Month must be less than 12'),
  year: () =>
    z
      .number()
      .int()
      .min(2000, 'Year must be greater than 2000')
      .max(3000, 'Year must be less than 3000'),
  password: () =>
    z
      .string()
      .trim()
      .min(5, 'Password must be at least 5 characters')
      .max(30, 'Password must be less than 30 characters'),
  fileName: () =>
    z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-zA-Z0-9]+$/,
        {
          message:
            'Invalid file name format. Must be UUID followed by file extension',
        }
      ),
  percentage: () =>
    z
      .number()
      .min(0, 'Percentage must be greater than 0')
      .max(100, 'Percentage must be less than 100'),

  remark: () =>
    z.string().trim().max(500, 'Remark must be less than 500 characters'),
  info: () =>
    z.string().trim().max(500, 'Info must be less than 500 characters'),
  description: () =>
    z.string().trim().max(500, 'Description must be less than 500 characters'),
  file: () => z.object({}),

  pagination: {
    offset: () =>
      z.number().int().min(0, 'Offset must be greater than 0').default(0),
    limit: () =>
      z
        .number()
        .int()
        .min(1, 'Limit must be greater than 0')
        .max(100, 'Limit must be less than 100')
        .default(30),
  },
  sort_orders: (...fields: string[]) =>
    z
      .array(
        z.object({
          field: z.enum(fields),
          order: z.enum(['asc', 'desc']),
        })
      )
      .refine(
        (data) => new Set(data.map((item) => item.field)).size === data.length,
        {
          message: 'Sort orders must be unique by field',
        }
      ),
};
