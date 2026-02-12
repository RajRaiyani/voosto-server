import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import Logger from './service/logger/index.js';
import errorHandler from './middleware/errorHandler.js';
import appRoute from './routes/app.route.js';
import redisClient from './service/redis/index.js';
import { LoadActivitiesToRedis } from './components/activity/activity.script.js';

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
  await redisClient.connect();
  Logger.info('Redis connected successfully ✅');
  await LoadActivitiesToRedis();
  Logger.info('Database connected successfully ✅');
  Logger.info('Activities loaded to Redis successfully ✅');
});

export default app;
