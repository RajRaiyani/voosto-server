import { createClient } from 'redis';
import env from '@/config/env.js';

const redisClient = createClient({
  url: env.redis.url,
});


export default redisClient;