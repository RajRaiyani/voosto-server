import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';

type FriendRequestPayload = { sender_id: string; receiver_id: string };

async function onFriendRequestDeletedHandler(
  { database:db }: Context,
  payload: FriendRequestPayload,
): Promise<void> {
  const { sender_id, receiver_id } = payload;


  await db.query(`
    DELETE FROM notifications WHERE 
      type = 'new_friend_request' and
      user_id = $2 and
      meta_data->>'sender_id' = $1
    `, [sender_id, receiver_id]);
}

ServerEvent.on(
  'user:friend_request:rejected',
  RegisterServerEventHandler(onFriendRequestDeletedHandler, { withDatabase: true }),
);

