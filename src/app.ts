import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import Logger from './service/logger/index.js';
import errorHandler from './middleware/errorHandler.js';
import appRoute from './app.routes.js';
import redisClient from './service/redis/index.js';
import { LoadActivitiesToRedis } from './modules/activity/activity.script.js';
import '@/modules/activity/activity.init.js';
import '@/modules/user/user.init.js';
import '@/modules/conversation/conversation.init.js';
import {
  LoadActivitiesToRedisJob,
  LoadUsersToRedisJob,
  databaseBackupJob,
  fileBackupJob,
  FlushUnTrackedFilesJob,
  FlushFilesJob,
} from '@/cron/jobs.js';

import { LoadUsersToRedis } from './modules/user/scripts/loadUsersToRedis.js';

import env from './config/env.js';


const app = express();

app.use(morgan(':method :url Status : :status, Time taken: :response-time ms', {
  stream: { write: (message) => Logger.info(message) },
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
const serverStartTimeStamp = new Date().toISOString();

// Status route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    version: '1.0.0',
    startTime: serverStartTimeStamp,
    service: env.serviceName,
    codeSign: 'R.P.Raiyani',
    author: 'rajraiyani.com',
  });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pont');
});

app.use('/', appRoute);

app.use('/files', express.static(env.fileStoragePath));

// Error handler
app.use(errorHandler);



setImmediate(async () => {

  redisClient.on('connect', async () => {
    await LoadActivitiesToRedis();
    Logger.info('Activities loaded to Redis successfully ✅');
    await LoadUsersToRedis();
    Logger.info('Users loaded to Redis successfully ✅');
  });
  
  await redisClient.connect();
  Logger.info('Redis connected successfully ✅');

  await LoadActivitiesToRedisJob.start();
  Logger.info('Load Activities to Redis job started ✅');
  await LoadUsersToRedisJob.start();
  Logger.info('Load Users to Redis job started ✅');
  await databaseBackupJob.start();
  Logger.info('Database backup job started ✅');
  await fileBackupJob.start();
  Logger.info('File backup job started ✅');
  await FlushUnTrackedFilesJob.start();
  Logger.info('Flush Un Tracked Files job started ✅');
  await FlushFilesJob.start();
  Logger.info('Flush Files job started ✅');
});

export default app;
