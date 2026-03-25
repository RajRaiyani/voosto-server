import RegisterService, { Context as ServiceContext } from '@/core/registerService.js';
import ServerEvent from '@/service/event/index.js';

async function createFriendRequestService(ctx: ServiceContext, { sender_id, receiver_id }: { sender_id: string, receiver_id: string }) {

  const friendMapping = await ctx.database.queryOne(`
    INSERT INTO friend_mappings (sender_id, receiver_id, status)
    VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING
    RETURNING sender_id, receiver_id, status, created_at
  `, [sender_id, receiver_id]);

  ServerEvent.emit('user:friend_request:created', { sender_id, receiver_id });

  return friendMapping;
}


async function acceptFriendRequestService(ctx: ServiceContext, { sender_id, receiver_id }: { sender_id: string, receiver_id: string }) {
  const friendMapping = await ctx.database.queryOne(`
    UPDATE friend_mappings
    SET status = 'accepted'
    WHERE sender_id = $1 AND receiver_id = $2
    RETURNING sender_id, receiver_id, status, created_at
  `, [sender_id, receiver_id]);

  ServerEvent.emit('user:friend_request:accepted', { sender_id, receiver_id });

  return friendMapping;
}

async function unFriendUserServices(ctx: ServiceContext, { sender_id, receiver_id }: { sender_id: string, receiver_id: string }) {
  
  const friendMapping = await ctx.database.queryOne(`
    DELETE FROM friend_mappings
    WHERE (sender_id = $1 AND receiver_id = $2) or (sender_id = $2 AND receiver_id = $1)
    RETURNING sender_id, receiver_id, status
  `, [sender_id, receiver_id]);

  if (friendMapping && friendMapping.status === 'pending') {
    ServerEvent.emit('user:friend_request:rejected', { sender_id, receiver_id });
  }

  await ctx.database.query(`
    DELETE FROM notifications 
    WHERE 
      type in ('new_friend_request', 'friend_request_accepted', 'friend_request_accepted_self') and
      (
        (meta_data->>'sender_id' = $1 AND meta_data->>'receiver_id' = $2) OR 
        (meta_data->>'sender_id' = $2 AND meta_data->>'receiver_id' = $1)
      )
    `, [sender_id, receiver_id]);

  return friendMapping;
}

export const createFriendRequest = RegisterService(createFriendRequestService);
export const acceptFriendRequest = RegisterService(acceptFriendRequestService);
export const unFriendUser = RegisterService(unFriendUserServices);