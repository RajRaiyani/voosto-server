import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListActivitiesSchema, Controller as ListActivitiesController } from '@/modules/activity/controllers/listActivities.js';
import { ValidationSchema as CreateActivitySchema, Controller as CreateActivityController } from '@/modules/activity/controllers/createActivity.js';
import { ValidationSchema as GetActivitySchema, Controller as GetActivityController } from '@/modules/activity/controllers/getActivity.js';
import { ValidationSchema as UpdateActivitySchema, Controller as UpdateActivityController } from '@/modules/activity/controllers/updateActivity.js';
import { ValidationSchema as DeleteActivitySchema, Controller as DeleteActivityController } from '@/modules/activity/controllers/deleteActivity.js';
import { ValidationSchema as ReportActivitySchema, Controller as ReportActivityController } from '@/modules/activity/controllers/reportActivity.js';

const router = express.Router();

router.route('/')
  .get(isUserLoggedIn, validate(ListActivitiesSchema), WithDatabase(ListActivitiesController))
  .post(isUserLoggedIn, validate(CreateActivitySchema), WithDatabase(CreateActivityController));

router.route('/:activity_id')
  .get(isUserLoggedIn, validate(GetActivitySchema), WithDatabase(GetActivityController))
  .put(isUserLoggedIn, validate(UpdateActivitySchema), WithDatabase(UpdateActivityController))
  .delete(isUserLoggedIn, validate(DeleteActivitySchema), WithDatabase(DeleteActivityController));

router.route('/:activity_id/report')
  .post(isUserLoggedIn, validate(ReportActivitySchema), WithDatabase(ReportActivityController));

export default router;