import express from 'express';

import userRoute from '@/modules/user/user.route.js';
import fileRoute from '@/modules/file/file.route.js';
import metaRoute from '@/modules/meta/meta.route.js';
import postRoute from '@/modules/post/post.route.js';
import activityRoute from '@/modules/activity/activity.route.js';
import conversationRoute from '@/modules/conversation/conversation.route.js';
import tripRoute from '@/modules/trip/trip.route.js';
import notificationRoute from '@/modules/notification/notification.route.js';

const router = express.Router();

router.use('/users', userRoute);
router.use('/files', fileRoute);
router.use('/meta', metaRoute);
router.use('/posts', postRoute);
router.use('/activities', activityRoute);
router.use('/conversations', conversationRoute);
router.use('/trips', tripRoute);
router.use('/notifications', notificationRoute);

export default router;