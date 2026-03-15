import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createNotifications } from '@/modules/notification/notification.service.js';

type ConversationJoiningRequestAcceptedPayload = {
  conversation_id: string;
  user_id: string;
};

async function onConversationJoiningRequestAcceptedHandler(
  { database:db }: Context,
  payload: ConversationJoiningRequestAcceptedPayload,
): Promise<void> {
  const { conversation_id, user_id } = payload;

  const conversation = await db.queryOne<{
    id: string;
    name: string | null;
    display_picture_url: string | null;
  }>(`
    SELECT
      c.id,
      c.name,
      f.url AS display_picture_url
    FROM conversations c
    LEFT JOIN files f ON f.id = c.display_picture_id
    WHERE c.id = $1
  `, [conversation_id]);

  if (!conversation) return;

  const title = 'Join request accepted';
  const groupName = conversation.name || 'the group';

  await createNotifications(db, [user_id], {
    type: 'conversation_joining_request_accepted',
    title,
    body: `Your request to join "${groupName}" was accepted.`,
    conversation_id: conversation.id,
    conversation_name: conversation.name,
    conversation_display_picture_url: conversation.display_picture_url,
  });
}

ServerEvent.on(
  'conversation:conversation_joining_request:accepted',
  RegisterServerEventHandler(onConversationJoiningRequestAcceptedHandler, { withDatabase: true }),
);

