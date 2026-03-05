import { z } from 'zod';
import Constants from '@/config/constant.js';

export default {

  firstName : () => z.string().trim()
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z]*$/, { message: 'First name can only contain letters' }),

  lastName : () => z.string().trim()
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z]*$/, { message: 'Last name can only contain letters' }),

  interestedActivity : () => z.enum(Constants.user.interestedActivities.map(activity => activity.activity))

};