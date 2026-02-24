import { z } from 'zod';

export default {
  message: {
    content : () => z.string().trim().max(10000, 'Message content must be less than 10000 characters'),
  }
};
