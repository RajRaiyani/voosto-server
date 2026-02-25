import admin from 'firebase-admin';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Notification } from './index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configJsonFilePath = path.join(__dirname, '../../../FCM.json');

admin.initializeApp({
  credential: admin.credential.cert(configJsonFilePath),
});


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
  
  return results;
}
