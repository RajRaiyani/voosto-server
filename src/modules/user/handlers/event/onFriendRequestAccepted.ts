import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createNotifications } from '@/modules/notification/notification.service.js';

type FriendRequestPayload = { sender_id: string; receiver_id: string };

async function onFriendRequestAcceptedHandler(
  { database:db }: Context,
  payload: FriendRequestPayload,
): Promise<void> {
  const { sender_id, receiver_id } = payload;

  const receiver = await db.queryOne<{
    id: string;
    full_name: string;
    profile_image_url: string | null;
  }>(`
    SELECT
      u.id,
      u.full_name,
      f.url as profile_image_url
    FROM users u
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE u.id = $1
  `, [receiver_id]);

  const sender = await db.queryOne(`
    SELECT
      u.id,
      u.full_name,
      f.url as profile_image_url
    FROM users u
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE u.id = $1
  `, [sender_id]);

  if (!sender || !receiver) return;


  await createNotifications(db, [sender_id], {
    type: 'friend_request_accepted',
    title: `${receiver.full_name} is now your friend`,
    sender_id,
    receiver_id,
  }, {
    database: true,
    socket: true,
    pushNotifications: true,
  });
  
  await createNotifications(db, [receiver_id], {
    type: 'friend_request_accepted',
    title: `${sender.full_name} is now your friend`,
    sender_id,
    receiver_id,
  }, {
    database: true,
    socket: true,
    pushNotifications: true,
  });

  await db.query(`
    DELETE FROM notifications WHERE 
      type = 'new_friend_request' and
      user_id = $2 and
      meta_data->>'sender_id' = $1
    `, [sender_id, receiver_id]);
}

ServerEvent.on(
  'user:friend_request:accepted',
  RegisterServerEventHandler(onFriendRequestAcceptedHandler, { withDatabase: true }),
);

