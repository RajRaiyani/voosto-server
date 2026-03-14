import Database from '@/service/database/index.js';
import RedisClient from '@/service/redis/index.js';

export async function LoadUsersToRedis() {
  const db = await Database.getConnection();

  try {
    const users = await db.queryAll<{ member: string, latitude: number, longitude: number }>('SELECT id as member, latitude, longitude FROM users where latitude is not null and longitude is not null');
    if (users.length > 0) {
      await RedisClient.geoAdd('geo:user', users);
    }
  } finally {
    db.release();
  }
}