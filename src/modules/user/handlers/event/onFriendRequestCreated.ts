import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createNotifications } from '@/modules/notification/notification.service.js';

type FriendRequestPayload = { sender_id: string; receiver_id: string };

async function onFriendRequestCreatedHandler(
  { database:db }: Context,
  payload: FriendRequestPayload,
): Promise<void> {
  const { sender_id, receiver_id } = payload;

  const sender = await db.queryOne<{
    id: string;
    full_name: string;
    email: string;
    profile_image_url: string | null;
  }>(`
    SELECT
      u.id,
      u.full_name,
      f.url as profile_image_url
    FROM users u
    LEFT JOIN files f ON f.id = u.profile_image_id
    WHERE u.id = $1
  `, [sender_id]);

  if (!sender) return;

  await createNotifications(db, [receiver_id], {
    type: 'new_friend_request',
    title: `${sender.full_name} sent you a friend request.`,
    sender_id,
    receiver_id,
    sender_name : sender.full_name,
    Sender_profile_image_url : sender.profile_image_url
  });
}

ServerEvent.on(
  'user:friend_request:created',
  RegisterServerEventHandler(onFriendRequestCreatedHandler, { withDatabase: true }),
);
