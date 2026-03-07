import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { isMemberOfConversation } from '@/modules/conversation/conversation.service.js';
import { Context, SocketCallback } from '@/core/registerSocketEventHandler.js';

export const ValidationSchema = z.object({
  message_id: Schema.uuid(),
});

export async function Handler(ctx: Context, payload: z.infer<typeof ValidationSchema>, callback?: SocketCallback) {
  const { socket, database: db } = ctx;

  const { message_id } = payload as z.infer<typeof ValidationSchema>;

  const message = await db.queryOne<{ id: string; conversation_id: string; sender_id: string }>(`
    SELECT id, conversation_id, sender_id FROM messages WHERE id = $1
  `, [message_id]);

  if (!message) {
    if (typeof callback === 'function') {
      return callback({ success: false, message: 'Message not found' });
    }
    return;
  }

  const userId = socket.data.user?.id;
  if (message.sender_id !== userId) {
    if (typeof callback === 'function') {
      return callback({ success: false, message: 'You can only delete your own messages' });
    }
    return;
  }

  const isMember = await isMemberOfConversation(db, message.conversation_id, userId);
  if (!isMember) {
    if (typeof callback === 'function') {
      return callback({ success: false, message: 'You are not a member of this conversation' });
    }
    return;
  }

  await db.query('DELETE FROM message_attachments WHERE message_id = $1', [message_id]);
  await db.query('DELETE FROM messages WHERE id = $1', [message_id]);

  socket.to(message.conversation_id).emit('message:deleted', {
    message_id,
    conversation_id: message.conversation_id,
  });

  if (typeof callback === 'function') {
    callback({ success: true });
  }
}
