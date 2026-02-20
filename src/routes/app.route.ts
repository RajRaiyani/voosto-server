import express from 'express';

import userRoute from './user.route.js';
import fileRoute from './file.route.js';
import metaRoute from './meta.route.js';
import postRoute from './post.route.js';
import activityRoute from './activity.route.js';
import conversationRoute from './conversation.route.js';
import tripRoute from './trip.route.js';
import notificationRoute from './notification.route.js';

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