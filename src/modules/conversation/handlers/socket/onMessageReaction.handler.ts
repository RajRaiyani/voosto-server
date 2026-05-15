import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { toggleMessageReaction } from '@/modules/conversation/conversation.service.js';
import { Context, SocketCallback } from '@/core/registerSocketEventHandler.js';

export const ValidationSchema = z.object({
  message_id: Schema.uuid(),
  emoji: z
    .string()
    .trim()
    .min(1, 'Reaction emoji is required')
    .max(32, 'Reaction emoji must be less than 32 characters'),
});

export async function Handler(
  ctx: Context,
  payload: z.infer<typeof ValidationSchema>,
  callback: SocketCallback,
) {
  const { socket, database: db } = ctx;
  const userId = socket.data.user?.id;

  if (!userId) {
    return callback?.({ success: false, message: 'Unauthorized' });
  }

  const { message_id, emoji } = payload;

  const result = await toggleMessageReaction(db, message_id, userId, emoji);

  socket.to(result.conversation_id).emit('message:reaction', {
    message_id,
    conversation_id: result.conversation_id,
    reactions: result.reactions,
  });

  callback?.({ success: true, reactions: result.reactions });
}
