import Database from '@/service/database/index.js';
import RedisClient from '@/service/redis/index.js';

export async function LoadActivitiesToRedis() {
  const db = await Database.getConnection();

  try {
    const activities = await db.queryAll<{ member: string, latitude: number, longitude: number }>('SELECT id as member, latitude::float, longitude::float FROM activities where latitude is not null and longitude is not null');

    // Redis GEOADD rejects NaN/Infinity, so keep only finite coordinates.
    const validActivities = activities.filter(
      (activity) => Number.isFinite(activity.latitude) && Number.isFinite(activity.longitude)
    );

    if (validActivities.length > 0) {
      await RedisClient.geoAdd('geo:activity', validActivities);
    }
  } finally {
    db.release();
  }
}