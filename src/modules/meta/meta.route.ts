import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import withDatabase from '@/core/withDatabase.js';

import { Controller as listCountriesController } from '@/modules/meta/controllers/listCountries.js';
import { Controller as listActivitiesCategoriesController } from '@/modules/meta/controllers/listActivityCategories.js';

const router = express.Router();

router.route('/countries').get(WithDatabase(listCountriesController));
router.route('/activity-categories').get(withDatabase(listActivitiesCategoriesController));

export default router;