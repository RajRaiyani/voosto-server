import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListNotificationsSchema, Controller as ListNotificationsController } from '@/modules/notification/controllers/listNotifications.js';
import { Controller as ClearNotificationsController } from '@/modules/notification/controllers/clearNotifications.js';
import { ValidationSchema as DeleteNotificationSchema, Controller as DeleteNotificationController } from '@/modules/notification/controllers/deleteNotification.js';

const router = express.Router();

router
  .route('/')
  .get(isUserLoggedIn, validate(ListNotificationsSchema), WithDatabase(ListNotificationsController))
  .delete(isUserLoggedIn, WithDatabase(ClearNotificationsController));

router
  .route('/:notification_id')
  .delete(isUserLoggedIn, validate(DeleteNotificationSchema), WithDatabase(DeleteNotificationController));

export default router;
