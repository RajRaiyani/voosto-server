import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { Context, SocketCallback } from '@/core/registerSocketEventHandler.js';

export const ValidationSchema = z.object({
  message_id: Schema.uuid(),
});

export async function Handler(ctx: Context, payload: z.infer<typeof ValidationSchema>, callback: SocketCallback) {
  const { socket, database: db } = ctx;

  const { message_id } = payload as z.infer<typeof ValidationSchema>;

  const userId = socket.data.user?.id;
  if (!userId) return callback({ success: false, message: 'Unauthorized' });

  const message = await db.queryOne(
    `
      SELECT m.conversation_id
      FROM messages m
      INNER JOIN conversation_members cm
        ON cm.conversation_id = m.conversation_id
        AND cm.user_id = $2
      WHERE m.id = $1
    `,
    [message_id, userId]
  );

  if (!message) return callback({ success: false, message: 'Message not found' });

  await db.query(
    `
      INSERT INTO message_reads (message_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [message_id, userId]
  );

  if (typeof callback === 'function') {
    callback({ success: true });
  }
}