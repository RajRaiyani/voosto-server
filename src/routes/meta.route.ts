import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';

import { Controller as listCountriesController } from '@/modules/meta/listCountries.js';
import { Controller as listUserInterestedActivitiesController } from '@/modules/meta/listUserInterestedActivities.js';
import { Controller as listActivitiesCategoriesController } from '@/modules/meta/listActivityCategories.js';

const router = express.Router();

router.route('/countries').get(WithDatabase(listCountriesController));
router.route('/user-interested-activities').get(listUserInterestedActivitiesController);
router.route('/activity-categories').get(listActivitiesCategoriesController);

export default router;