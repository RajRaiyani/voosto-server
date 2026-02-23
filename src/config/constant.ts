import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import errorCodes from './errorCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const temporaryFileStoragePath = path.join(__dirname, '../../tmp');

if (!fs.existsSync(temporaryFileStoragePath))
  fs.mkdirSync(temporaryFileStoragePath);

const userInterestedActivities = [
  {
    activity: 'All activities',
    icon: '✨',
  },
  {
    activity: 'Food & Drinks',
    icon: '🍽️',
  },
  {
    activity: 'Nightlife',
    icon: '🎉',
  },
  {
    activity: 'Outdoor & Active',
    icon: '🏕️',
  },
  {
    activity: 'Sightseeing',
    icon: '🗺️',
  },
  {
    activity: 'Entertainment',
    icon: '🎭',
  },
  {
    activity: 'Shopping',
    icon: '🛍️',
  },
  {
    activity: 'Wellness',
    icon: '🧘',
  },
  {
    activity: 'Rideshare',
    icon: '🚗',
  },
  {
    activity: 'Social',
    icon: '💬',
  },
];

const activitiesCategories = [
  {
    activity: 'Food & Drinks',
    icon: '🍽️',
  },
  {
    activity: 'Nightlife',
    icon: '🎉',
  },
  {
    activity: 'Outdoor & Active',
    icon: '🏕️',
  },
  {
    activity: 'Sightseeing',
    icon: '🗺️',
  },
  {
    activity: 'Entertainment',
    icon: '🎭',
  },
  {
    activity: 'Shopping',
    icon: '🛍️',
  },
  {
    activity: 'Wellness',
    icon: '🧘',
  },
  {
    activity: 'Other',
    icon: '🔍',
  },
];

export default {
  temporaryFileStoragePath,

  user: {
    token: {
      expiryInSeconds: 86400,
    },
    interestedActivities: userInterestedActivities,
  },

  activities: {
    categories: activitiesCategories,
  },

  errorCodes,
};
