import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { Context, SocketCallback } from '@/core/registerSocketEventHandler.js';

export const ValidationSchema = z.object({
  message_id: Schema.uuid(),
});

export async function Handler(ctx: Context, payload: z.infer<typeof ValidationSchema>, callback: SocketCallback) {
  const { socket, database: db } = ctx;

  const { message_id } = payload as z.infer<typeof ValidationSchema>;


  const message = await db.queryOne(`
    SELECT * FROM messages WHERE id = $1
  `, [message_id]);

  if (!message) {
    return callback({ success: false, message: 'Message not found' });
  }

  await db.query(`
    UPDATE messages SET seen_at = now() WHERE id = $1
  `, [message_id]);

  socket.to(message.conversation_id).emit('message:seen', {
    message_id,
    seen_at: message.seen_at,
  });

  if (typeof callback === 'function') {
    callback({ success: true });
  }
}