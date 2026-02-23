import admin from 'firebase-admin';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Notification } from './index.js';
import database from '../database/index.js';

const tokenValidationErrors = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
  'messaging/invalid-argument',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configJsonFilePath = path.join(__dirname, '../../../FCM.json');

admin.initializeApp({
  credential: admin.credential.cert(configJsonFilePath),
});

export async function sendMessage(token: string, notification: Notification) {
  const message = {
    token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification,
  };
  try {
    const result = await admin.messaging().send(message);
    return result;
  } catch (error) {
    if (tokenValidationErrors.includes(error.code)) {
      await database.query(`
        DELETE FROM user_notification_tokens
        WHERE token = $1
      `, [token]);
    }
    return null;
  }
}

export async function sendMulticastMessage(tokens: string[], notification: Notification) {
  const message = {
    tokens,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification,
  };

  const results = await admin.messaging().sendEachForMulticast(message);
  const tokensToDelete = [];

  results.responses.forEach((result, index) => {
    if (!result.success && tokenValidationErrors.includes(result.error?.code)) {
      tokensToDelete.push(tokens[index]);
    }
  });

  if (tokensToDelete.length > 0) {
    await database.query(`
      DELETE FROM user_notification_tokens
      WHERE token = ANY($1)
    `, [tokensToDelete]);
  }
  
  return results;
}
