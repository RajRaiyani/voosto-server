import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListActivitiesSchema, Controller as ListActivitiesController } from '@/components/activity/listActivities.js';
import { ValidationSchema as CreateActivitySchema, Controller as CreateActivityController } from '@/components/activity/createActivity.js';

const router = express.Router();

router.route('/')
  .get(isUserLoggedIn, validate(ListActivitiesSchema), WithDatabase(ListActivitiesController))
  .post(isUserLoggedIn, validate(CreateActivitySchema), WithDatabase(CreateActivityController));

export default router;