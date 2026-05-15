import { z } from 'zod';
import Schema from '@/config/validationSchema.js';
import { createMessage, ensureMember } from '@/modules/conversation/conversation.service.js';
import { saveFile } from '@/modules/file/file.service.js';
import { Context, SocketCallback } from '@/core/registerSocketEventHandler.js';

export const ValidationSchema = z.object({
  conversation_id: Schema.uuid(),
  content: z
    .string()
    .trim()
    .max(10000, 'Message content must be less than 10000 characters').default(''),
  attachments: z.array(z.uuid()).default([]),
  reply_to_message_id: Schema.uuid().optional().nullable(),
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

  const { conversation_id, content, attachments, reply_to_message_id } = payload;

  await ensureMember(db, conversation_id, userId);

  const savedAttachments = await Promise.all(attachments.map(async (attachment) => {
    return saveFile({ database: db }, { id: attachment });
  }));

  const message = await createMessage(db, {
    conversationId: conversation_id,
    senderId: userId,
    content: content.trim(),
    attachments,
    replyToMessageId: reply_to_message_id ?? null,
  }, {
    socket: true,
    pushNotifications: true,
  });

  callback?.({ success: true, message_id: message.id, message });

  socket.to(conversation_id).emit('message:new', {
    id: message.id,
    conversation_id: message.conversation_id,
    content: message.content,
    created_at: message.created_at,
    sender: message.sender ?? socket.data.user,
    attachments: savedAttachments.length > 0 ? savedAttachments : message.attachments,
    reply_to: message.reply_to,
    reactions: message.reactions,
  });
}
