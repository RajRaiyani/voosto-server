import cron from 'node-cron';
import env from '@/config/env.js';
import { task as flushUnTrackedFilesTask } from './scripts/flushUnTrackedFiles.script.js';
import { task as flushFilesTask } from './scripts/flushFiles.script.js';
import { task as databaseBackupTask } from './scripts/databaseBackup.script.js';
import { task as fileBackupTask } from './scripts/fileBackup.script.js';
import { LoadActivitiesToRedis } from '@/modules/activity/activity.script.js';
import { LoadUsersToRedis } from '@/modules/user/scripts/loadUsersToRedis.js';
import { task as convertToWebpTask } from './scripts/convertToWebp.js';
import { task as extendFakeUserActivityDatesTask } from './scripts/extendFakeUserActivityDates.script.js';

const isProduction = env.env === 'prod';


/**
# ┌────────────── second (optional)
# │ ┌──────────── minute
# │ │ ┌────────── hour
# │ │ │ ┌──────── day of month
# │ │ │ │ ┌────── month
# │ │ │ │ │ ┌──── day of week
# │ │ │ │ │ │
# │ │ │ │ │ │
# * * * * * *
*/

// Run at midnight every 2 days
export const FlushUnTrackedFilesJob = isProduction ?
  cron.createTask('0 0 */2 * *', './scripts/flushUnTrackedFiles.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 0 */2 * *', flushUnTrackedFilesTask, { timezone: 'Asia/Kolkata', });

// Run at 2:00 AM every 3 days
export const FlushFilesJob = isProduction ?
  cron.createTask('0 2 */3 * *', './scripts/flushFiles.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 2 */3 * *', flushFilesTask, { timezone: 'Asia/Kolkata', });


// Run at 2:30 AM every day
export const databaseBackupJob = isProduction
  ? cron.createTask('30 2 * * *', './scripts/databaseBackup.script.js', { timezone: 'Asia/Kolkata' })
  : cron.createTask('30 2 * * *', databaseBackupTask, { timezone: 'Asia/Kolkata' });

// Run at 3:00 AM every 3 days
export const fileBackupJob = isProduction
  ? cron.createTask('0 3 */3 * *', './scripts/fileBackup.script.js', { timezone: 'Asia/Kolkata' })
  : cron.createTask('0 3 */3 * *', fileBackupTask, { timezone: 'Asia/Kolkata' });

// Run at 4:00 AM every day
export const LoadActivitiesToRedisJob = cron.createTask('0 4 * * *', LoadActivitiesToRedis, { timezone: 'Asia/Kolkata' });

// Run at 5:00 AM every day
export const LoadUsersToRedisJob = cron.createTask('0 5 * * *', LoadUsersToRedis, { timezone: 'Asia/Kolkata' });

// Run at 11:30 PM every day — extend today's fake-user activities by 1–5 days
export const ExtendFakeUserActivityDatesJob = isProduction
  ? cron.createTask('30 23 * * *', './scripts/extendFakeUserActivityDates.script.js', { timezone: 'Asia/Kolkata' })
  : cron.createTask('30 23 * * *', extendFakeUserActivityDatesTask, { timezone: 'Asia/Kolkata' });

// Run at every 3 hours
export const ConvertToWebpJob =  isProduction ? 
  cron.createTask('0 */3 * * *', './scripts/convertToWebp.script.js', { timezone: 'Asia/Kolkata' }) : 
  cron.createTask('0 */3 * * *', convertToWebpTask, { timezone: 'Asia/Kolkata' });