import Database from '@/service/database/index.js';
import RedisClient from '@/service/redis/index.js';

export async function LoadActivitiesToRedis() {
  const db = await Database.getConnection();

  try {
    const activities = await db.queryAll<{ member: string, latitude: number, longitude: number }>('SELECT id as member, latitude, longitude FROM activities where latitude is not null and longitude is not null');
    if (activities.length > 0) {
      await RedisClient.geoAdd('geo:activity', activities);
    }
  } finally {
    db.release();
  }
}