import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import errorCodes from './errorCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const temporaryFileStoragePath = path.join(__dirname, '../../tmp');

if (!fs.existsSync(temporaryFileStoragePath)) fs.mkdirSync(temporaryFileStoragePath);


const userInterestedActivities = [
  {
    activity: 'All activities',
    icon: '✨'
  },{
    activity: 'Food & Drinks',
    icons: '🍽️'
  },{
    activity: 'Nightlife',
    icons: '🎉'
  },{
    activity: 'Outdoor & Active',
    icons: '🏕️'
  },{
    activity: 'Sightseeing',
    icons: '🗺️'
  },{
    activity: 'Entertainment',
    icons: '🎭'
  },{
    activity: 'Shopping',
    icons: '🛍️'
  },{
    activity: 'Wellness',
    icons: '🧘'
  },{
    activity: 'Rideshare',
    icons: '🚗'
  },{
    activity: 'Social',
    icons: '💬'
  }
];

export default {
  temporaryFileStoragePath,

  user: {
    token: {
      expiryInSeconds: 86400,
    },
    interestedActivities : userInterestedActivities
  },

  errorCodes,

};
