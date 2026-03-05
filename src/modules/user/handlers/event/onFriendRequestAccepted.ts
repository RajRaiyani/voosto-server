import ServerEvent, { EventContext, EventContextProvider } from '@/service/event/index.js';
import { createNotifications } from '@/modules/notification/notification.service.js';
import { NotificationType } from '@/service/notification/index.js';

type FriendRequestPayload = { sender_id: string; receiver_id: string };

async function onFriendRequestAcceptedHandler(
  { db }: EventContext,
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

  if (!receiver) return;

  await createNotifications(db, [sender_id], {
    type: NotificationType.FRIEND_REQUEST_ACCEPTED,
    title: 'Friend request accepted',
    body: `${receiver.full_name} accepted your friend request.`,
    sender_id,
    receiver_id,
    receiver_name: receiver.full_name,
    receiver_profile_image_url: receiver.profile_image_url,
  });
}

ServerEvent.on(
  'friend_request:accepted',
  EventContextProvider(onFriendRequestAcceptedHandler, { withDatabase: true }),
);

