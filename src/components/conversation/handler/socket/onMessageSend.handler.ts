import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { createMessage } from '@/components/conversation/conversation.service.js';

import { HandlerContext, SocketCallback } from '@/socket/socket.type.js';

export const ValidationSchema = z.object({
  conversation_id: Schema.uuid(),
  content: z
    .string()
    .trim()
    .max(10000, 'Message content must be less than 10000 characters').default(''),
  attachments: z.array(z.uuid()).default([]),
});

export async function Handler(
  ctx: HandlerContext,
  payload: z.infer<typeof ValidationSchema>,
  callback: SocketCallback,
) {
  const { socket, db } = ctx;

  const { conversation_id, content, attachments } = payload;

  await createMessage(db, {
    conversationId: conversation_id,
    senderId: socket.data.user.id,
    content: content.trim(),
    attachments,
  });

  socket.to(conversation_id).emit('message:new', {
    conversation_id,
    sender: socket.data.user,
    content,
    attachments,
  });

  if (typeof callback === 'function') {
    callback({ success: true });
  }
}
