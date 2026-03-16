import { DatabaseClient } from '@/service/database/index.js';
import Socket from '@/socket.js';
import { Notification } from '@/service/notification/index.js';
import { sendMulticastMessage } from '@/service/notification/sendMessage.js';
import Logger from '@/service/logger/index.js';

const tokenValidationErrors = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
  'messaging/invalid-argument',
];


export async function sendNotifications(
  db: DatabaseClient,
  tokens: string[],
  notification: Notification,
) {


  const results = await sendMulticastMessage(tokens, notification);
  const tokensToDelete = [];

  results.responses.forEach((result, index) => {
    if (!result.success) {
      if (tokenValidationErrors.includes(result.error?.code)){
        tokensToDelete.push(tokens[index]);
      }else{
        Logger.error(`Failed to send notification to token ${tokens[index]}`, result.error);
      }
    }
  });

  if (tokensToDelete.length > 0) {
    await db.query(`
      DELETE FROM user_notification_tokens
      WHERE token = ANY($1)
    `, [tokensToDelete]);
  }
  
}



export async function createNotifications(
  db: DatabaseClient,
  user_ids: string[],
  notification: Notification,
  transports: {
    database?: boolean;
    socket?: boolean;
    pushNotifications?: boolean;
  } = { database: true, socket: true, pushNotifications: true },
) {

  const { title, body, type, ...meta_data } = notification;

  if (user_ids.length === 0) return [];

  let notifications = [];

  if (transports.database) {
    notifications = await db.queryAll(
      `
    INSERT INTO notifications (user_id, type, title, body, meta_data)
    SELECT unnest($1::uuid[]), $2, $3, $4, $5
    RETURNING id, user_id, title, body, type, meta_data, created_at
  `,
      [user_ids, notification.type, notification.title, notification.body, meta_data ?? {}],
    );
  }

  if (transports.socket) {
    Socket.io.to(user_ids).emit('notification:new', notifications);
  }

  if (transports.pushNotifications) {
    const tokenResponse = await db.queryAll(
      'SELECT token FROM user_notification_tokens WHERE user_id = ANY($1)',
      [user_ids],
    );

    const tokens = tokenResponse.map(token => token.token);

    if (tokens.length > 0) {
      await sendNotifications(db, tokens, {
        title: title,
        body: body,
        type: type,
        ...meta_data,
      });
    }
  }

  return notifications;
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

