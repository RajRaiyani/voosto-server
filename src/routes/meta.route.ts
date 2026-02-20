import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';

import { Controller as listCountriesController } from '@/components/meta/listCountries.js';
import { Controller as listUserInterestedActivitiesController } from '@/components/meta/listUserInterestedActivities.js';
import { Controller as listActivitiesCategoriesController } from '@/components/meta/listActivityCategories.js';

const router = express.Router();

router.route('/countries').get(WithDatabase(listCountriesController));
router.route('/user-interested-activities').get(listUserInterestedActivitiesController);
router.route('/activity-categories').get(listActivitiesCategoriesController);

export default router;