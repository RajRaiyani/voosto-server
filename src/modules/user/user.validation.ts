import { z } from 'zod';
import Constants from '@/config/constant.js';

export default {

  firstName : () => z.string().trim()
    .max(100, 'First name must be less than 100 characters'),

  lastName : () => z.string().trim()
    .max(100, 'Last name must be less than 100 characters'),

  interestedActivity : () => z.enum(Constants.user.interestedActivities.map(activity => activity.activity))

};