import { DatabaseClient } from '@/service/database/index.js';
import Socket from '@/socket/index.js';

export async function createNotification(
  db: DatabaseClient,
  {
    user_id,
    message,
    type = 'general',
    meta_data = {},
  }: { user_id: string; message?: string; type?: string; meta_data?: object },
) {

  const notification = await db.queryOne(
    `
    INSERT INTO notifications (user_id, message, type, meta_data)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, message, type, meta_data, created_at
  `,
    [user_id, message, type, meta_data],
  );

  Socket.userIo.to(user_id).emit('notification:new', notification);

  return notification;
}


export async function deleteNotification(db: DatabaseClient, { id }: { id: string }) {
  await db.query(`
    DELETE FROM notifications WHERE id = $1
  `, [id]);
}

export async function listUserNotifications(db: DatabaseClient, userId: string, { offset=0, limit=100 }: { offset?: number; limit?: number } = {}) {
  const notifications = await db.queryAll(
    `
    SELECT id, type, meta_data, created_at
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    OFFSET $2 LIMIT $3
  `,
    [userId, offset, limit],
  );
  return notifications;
}


export async function clearUserNotifications(db: DatabaseClient, userId: string) {
  await db.query(`
    DELETE FROM notifications WHERE user_id = $1
  `, [userId]);
}