import ServerEvent, { EventContext, EventContextProvider } from '@/service/event/index.js';
import { createNotifications } from '@/components/notification/notification.service.js';
import { NotificationType } from '@/service/notification/index.js';

type ConversationJoiningRequestAcceptedPayload = {
  conversation_id: string;
  user_id: string;
};

async function onConversationJoiningRequestAcceptedHandler(
  { db }: EventContext,
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
    type: NotificationType.CONVERSATION_JOINING_REQUEST_ACCEPTED,
    title,
    body: `Your request to join "${groupName}" was accepted.`,
    conversation_id: conversation.id,
    conversation_name: conversation.name,
    conversation_display_picture_url: conversation.display_picture_url,
  });
}

ServerEvent.on(
  'conversation_joining_request:accepted',
  EventContextProvider(onConversationJoiningRequestAcceptedHandler, { withDatabase: true }),
);

