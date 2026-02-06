import cron from 'node-cron';
import env from '@/config/env.js';
import { task as flushUnTrackedFilesTask } from './scripts/flushUnTrackedFiles.script.js';
import { task as flushFilesTask } from './scripts/flushFiles.script.js';

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

// Run at midnight every 10 days
export const FlushUnTrackedFilesJob = isProduction ?
  cron.createTask('0 0 */10 * *', './scripts/flushUnTrackedFiles.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 0 */10 * *', flushUnTrackedFilesTask, { timezone: 'Asia/Kolkata', });

// Run at 2:00 AM every 3 days
export const FlushFilesJob = isProduction ?
  cron.createTask('0 2 */3 * *', './scripts/flushFiles.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 2 */3 * *', flushFilesTask, { timezone: 'Asia/Kolkata', });
