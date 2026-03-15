import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createNotifications } from '@/modules/notification/notification.service.js';

type ConversationJoiningRequestPayload = {
  conversation_id: string;
  user_id: string;
};

async function onConversationJoiningRequestCreatedHandler(
  { database:db }: Context,
  payload: ConversationJoiningRequestPayload,
): Promise<void> {
  const { conversation_id, user_id } = payload;

  const requester = await db.queryOne<{
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
  `, [user_id]);

  if (!requester) return;

  const admins = await db.queryAll<{ user_id: string }>(`
    SELECT user_id
    FROM conversation_members
    WHERE conversation_id = $1
      AND is_admin = true
  `, [conversation_id]);

  const adminIds = admins.map(a => a.user_id);
  if (adminIds.length === 0) return;

  await createNotifications(db, adminIds, {
    type: 'new_conversation_joining_request',
    title: 'New join request',
    body: `${requester.full_name} requested to join your group.`,
    conversation_id,
    requester_id: requester.id,
    requester_name: requester.full_name,
    requester_profile_image_url: requester.profile_image_url,
  });
}

ServerEvent.on(
  'conversation:conversation_joining_request:created',
  RegisterServerEventHandler(onConversationJoiningRequestCreatedHandler, { withDatabase: true }),
);

