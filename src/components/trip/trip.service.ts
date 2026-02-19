import { DatabaseClient } from '@/service/database/index.js';

export async function deleteTrip(db: DatabaseClient, id: string) {
  const trip = await db.queryOne('SELECT id, conversation_id FROM trips WHERE id = $1', [id]);
  if (!trip) return;
  try {
    await db.begin();
    await db.query('DELETE FROM trips WHERE id = $1', [id]);
    await db.query('DELETE FROM conversation_members WHERE conversation_id = $1', [trip.conversation_id]);
    await db.query('DELETE FROM conversations WHERE id = $1', [trip.conversation_id]);
    await db.commit();
    return trip;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
