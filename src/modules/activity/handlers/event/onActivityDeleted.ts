import ServerEvent from '@/service/event/index.js';
import RegisterServerEventHandler, { Context } from '@/core/registerServerEventHandler.js';
import { createMessage } from '@/modules/conversation/conversation.service.js';
import Socket from '@/socket.js';

async function Handler({ database:db }: Context, activityId: string, conversationId: string) {

  const message = await createMessage(db, {
    conversationId,
    content: 'Activity deleted for this Conversation',
  }, {
    pushNotifications: false,
    socket: false,
  });

  Socket.io.to(conversationId).emit('message:new', {
    conversation_id: conversationId,
    content: 'Activity deleted for this Conversation',
    id: message.id
  });
}

ServerEvent.on('activity:deleted', RegisterServerEventHandler(Handler, { withDatabase: true }));