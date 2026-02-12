import { z } from 'zod';
import Constants from '@/config/constant.js';

export default {
  category: () => z.enum(Constants.activities.categories.map(category => category.activity)),
};