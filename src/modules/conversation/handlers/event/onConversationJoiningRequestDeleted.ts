import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createNotifications } from '@/modules/notification/notification.service.js';

type ConversationJoiningRequestDeletedPayload = {
  conversation_id: string;
  user_id: string;
  deleted_by: string;
};

async function onConversationJoiningRequestDeletedHandler(
  { database:db }: Context,
  payload: ConversationJoiningRequestDeletedPayload,
): Promise<void> {
  const { conversation_id, deleted_by, user_id } = payload;


  await db.query(`
    DELETE FROM notifications WHERE 
      type = 'new_conversation_joining_request' and
      user_id = $2 and
      meta_data->>'conversation_id' = $1
  `, [conversation_id, deleted_by]);


  const conversation = await db.queryOne('SELECT display_emoji, name FROM conversations WHERE id = $1', [conversation_id]);

  if (!conversation) return;

  await createNotifications(db, [user_id], {
    type: 'conversation_joining_request_deleted',
    title: 'Join request deleted',
    body: `Your request to join "${conversation.name || 'the group'}" was deleted.`,
    conversation_id: conversation_id,
    conversation_display_emoji: conversation.display_emoji,
  });
}

ServerEvent.on(
  'conversation:conversation_joining_request:deleted',
  RegisterServerEventHandler(onConversationJoiningRequestDeletedHandler, { withDatabase: true }),
);

