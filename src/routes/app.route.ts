import express from 'express';

import userRoute from './user.route.js';
import fileRoute from './file.route.js';
import metaRoute from './meta.route.js';
import postRoute from './post.route.js';

const router = express.Router();

router.use('/users', userRoute);
router.use('/files', fileRoute);
router.use('/meta', metaRoute);
router.use('/posts', postRoute);

export default router;