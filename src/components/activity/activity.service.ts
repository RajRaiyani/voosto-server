import { DatabaseClient } from '@/service/database/index.js';


export async function deleteActivity(db: DatabaseClient, id: string) {
  const activity = await db.queryOne('SELECT id, conversation_id FROM activities WHERE id = $1', [id]);
  if (!activity) return;
  try{
    await db.begin();
    await db.query('DELETE FROM activities WHERE id = $1', [id]);
    await db.query('DELETE FROM conversation_participants WHERE conversation_id = $1', [activity.conversation_id]);
    await db.query('DELETE FROM conversations WHERE id = $1', [activity.conversation_id]);
    await db.commit();
    return activity;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}