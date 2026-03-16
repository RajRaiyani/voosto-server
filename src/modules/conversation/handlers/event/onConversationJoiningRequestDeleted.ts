import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';

type ConversationJoiningRequestDeletedPayload = {
  conversation_id: string;
  user_id: string;
  deleted_by: string;
};

async function onConversationJoiningRequestDeletedHandler(
  { database:db }: Context,
  payload: ConversationJoiningRequestDeletedPayload,
): Promise<void> {
  const { conversation_id, deleted_by } = payload;


  await db.query(`
    DELETE FROM notifications WHERE 
      type = 'new_conversation_joining_request' and
      user_id = $2 and
      meta_data->>'conversation_id' = $1
  `, [conversation_id, deleted_by]);
}

ServerEvent.on(
  'conversation:conversation_joining_request:deleted',
  RegisterServerEventHandler(onConversationJoiningRequestDeletedHandler, { withDatabase: true }),
);

